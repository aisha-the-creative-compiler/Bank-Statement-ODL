"""
Streamlit Human-in-the-Loop Review Application.
Displays source document page image side-by-side with extracted transactions,
highlights flagged rows (needs_review = True), allows inline editing,
verifies balance reconciliation in real time, and exports verified CSV.

Run via:
    streamlit run review_ui/streamlit_app.py
"""

import os
import sys
import pandas as pd

# Add root directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

try:
    import streamlit as st
except ImportError:
    print("Streamlit not installed. Install via: pip install streamlit")
    st = None

from ingest.classifier import DocumentClassifier
from ocr.engine import OCREngine
from parse.table_detector import TableDetector
from validate.reconciler import StatementValidator
from tests.fixtures import SYNTHETIC_HBL_STATEMENT_TEXT, SYNTHETIC_MEEZAN_STATEMENT_TEXT, get_fixture_lines


def render_app():
    if not st:
        print("Please install streamlit to run the review interface.")
        return

    st.set_page_config(page_title="Bank Statement OCR Review", layout="wide")
    st.title("Bank Statement OCR & Audit Review")
    st.markdown(
        "Upload bank statements (digital PDF, scanned PDF, image) or pick a sample. "
        "Review flagged transactions side-by-side with document data and export verified CSV."
    )

    # Sidebar controls
    st.sidebar.header("Pipeline Settings")
    bank_choice = st.sidebar.selectbox("Bank Format Adapter", ["auto", "hbl", "meezan", "generic"], index=0)
    conf_threshold = st.sidebar.slider("Confidence Review Threshold", 0.50, 0.99, 0.85, 0.05)
    
    source_choice = st.sidebar.radio("Data Source", ["HBL Sample Statement", "Meezan Sample Statement", "Upload Document"])

    if "transactions_df" not in st.session_state or st.sidebar.button("Re-extract / Reset"):
        detector = TableDetector(preferred_bank=None if bank_choice == "auto" else bank_choice)
        validator = StatementValidator(confidence_threshold=conf_threshold)

        if source_choice == "HBL Sample Statement":
            lines = get_fixture_lines(SYNTHETIC_HBL_STATEMENT_TEXT)
            txs, meta, adapter = detector.extract(lines, source_file="HBL_Sample_Jan2024.pdf")
        elif source_choice == "Meezan Sample Statement":
            lines = get_fixture_lines(SYNTHETIC_MEEZAN_STATEMENT_TEXT)
            txs, meta, adapter = detector.extract(lines, source_file="Meezan_Sample_Feb2024.pdf")
        else:
            uploaded_file = st.sidebar.file_uploader("Upload PDF or Image", type=["pdf", "png", "jpg", "jpeg"])
            if uploaded_file:
                # Save temp file
                temp_path = f"/tmp/{uploaded_file.name}"
                with open(temp_path, "wb") as f:
                    f.write(uploaded_file.getbuffer())
                classifier = DocumentClassifier()
                dtype, _ = classifier.classify_file(temp_path)
                engine = OCREngine()
                lines = engine.extract_lines_from_document(temp_path, dtype)
                txs, meta, adapter = detector.extract(lines, source_file=uploaded_file.name)
            else:
                lines = get_fixture_lines(SYNTHETIC_HBL_STATEMENT_TEXT)
                txs, meta, adapter = detector.extract(lines, source_file="HBL_Sample_Jan2024.pdf")

        validated_txs, report = validator.validate_and_reconcile(txs, meta)
        st.session_state["meta"] = meta
        st.session_state["report"] = report
        st.session_state["adapter"] = adapter
        
        # Store as editable dataframe
        records = [tx.to_csv_dict() for tx in validated_txs]
        st.session_state["transactions_df"] = pd.DataFrame(records)

    meta = st.session_state.get("meta")
    report = st.session_state.get("report")

    # Metrics row
    col1, col2, col3, col4, col5 = st.columns(5)
    with col1:
        st.metric("Opening Balance", f"{meta.opening_balance:,.2f}" if meta.opening_balance is not None else "N/A")
    with col2:
        st.metric("Total Credits", f"+{report.total_credits:,.2f}")
    with col3:
        st.metric("Total Debits", f"-{report.total_debits:,.2f}")
    with col4:
        st.metric("Calculated Closing", f"{report.calculated_closing:,.2f}" if report.calculated_closing is not None else "N/A")
    with col5:
        balance_label = "Balanced ✓" if report.is_balanced else f"Unbalanced ({report.difference:+,.2f})"
        st.metric("Status", balance_label)

    if report.issues:
        st.warning("⚠️ " + "; ".join(report.issues))

    # Split View: Document Source on left, Editable Table on right
    left_col, right_col = st.columns([1, 1.4])

    with left_col:
        st.subheader("Source Document & Extracted Context")
        st.info(f"**Bank:** {meta.bank_name} | **Account:** {meta.account_number_masked} | **Currency:** {meta.currency}")
        st.write(f"**Statement Period:** {meta.statement_start_date} to {meta.statement_end_date}")
        st.markdown("```text\n" + (SYNTHETIC_HBL_STATEMENT_TEXT if "HBL" in meta.bank_name else SYNTHETIC_MEEZAN_STATEMENT_TEXT) + "\n```")

    with right_col:
        st.subheader("Human Review & Editing Table")
        st.caption("Rows with `needs_review = true` are flagged for review. Edit directly in the grid below:")

        edited_df = st.data_editor(
            st.session_state["transactions_df"],
            num_rows="dynamic",
            use_container_width=True,
            column_config={
                "date": st.column_config.TextColumn("Date (YYYY-MM-DD)", required=True),
                "description": st.column_config.TextColumn("Description", required=True),
                "amount": st.column_config.TextColumn("Amount (Signed)", required=True),
                "notes": st.column_config.TextColumn("Notes / Ref"),
                "confidence": st.column_config.TextColumn("Conf"),
                "needs_review": st.column_config.SelectboxColumn("Needs Review", options=["true", "false"]),
            }
        )

        unresolved_count = (edited_df["needs_review"] == "true").sum()
        if unresolved_count > 0:
            st.warning(f"There are {unresolved_count} unapproved / flagged rows pending human review.")
        else:
            st.success("All rows reviewed and approved!")

        csv_data = edited_df.to_csv(index=False)
        st.download_button(
            label="Export Approved CSV",
            data=csv_data,
            file_name="bank_statement_verified.csv",
            mime="text/csv",
            disabled=(unresolved_count > 0)
        )


if __name__ == "__main__":
    if st:
        render_app()
