"""
Bank configuration registry.
Manages built-in bank profiles, custom user profiles, and automatic bank layout detection.
"""

import json
import os
import re
from typing import Dict, List, Optional, Tuple
from .bank_profile import BankLayoutConfig
from .builtin_profiles import BUILTIN_BANK_PROFILES


class BankProfileRegistry:
    """Registry holding all active bank configuration profiles."""

    def __init__(self):
        self._profiles: Dict[str, BankLayoutConfig] = dict(BUILTIN_BANK_PROFILES)

    def register_profile(self, profile: BankLayoutConfig) -> None:
        """Registers or overrides a bank configuration profile."""
        self._profiles[profile.bank_id.lower()] = profile

    def get_profile(self, bank_id: str) -> Optional[BankLayoutConfig]:
        """Retrieves profile by bank ID (case-insensitive)."""
        return self._profiles.get(bank_id.lower())

    def list_profiles(self) -> List[BankLayoutConfig]:
        """Returns all registered profiles."""
        return list(self._profiles.values())

    def load_from_json_file(self, file_path: str) -> BankLayoutConfig:
        """Loads and registers a bank profile from a JSON configuration file."""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Configuration file not found: {file_path}")

        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        profile = BankLayoutConfig.from_dict(data)
        self.register_profile(profile)
        return profile

    def detect_profile(self, text_samples: List[str]) -> Tuple[BankLayoutConfig, float]:
        """
        Scans text samples to identify the matching bank profile based on keywords.
        Returns:
            (BestMatchingProfile, confidence_score)
        """
        combined = " ".join(text_samples).lower()

        best_profile = self._profiles.get("generic")
        best_score = 0.0

        for bank_id, profile in self._profiles.items():
            if bank_id == "generic":
                continue

            score = 0.0
            matched_keywords = 0

            for kw in profile.keywords:
                if kw.lower() in combined:
                    matched_keywords += 1

            if profile.keywords and matched_keywords > 0:
                score = matched_keywords / len(profile.keywords)
                clean_name = re.sub(r"\(.*?\)", "", profile.bank_name).strip().lower()
                if clean_name in combined or profile.bank_id.lower() in combined or any(kw in combined for kw in profile.keywords[:2]):
                    score = max(score, 0.90)

            if score > best_score:
                best_score = score
                best_profile = profile

        if best_profile is None:
            best_profile = self._profiles["generic"]
            best_score = 0.1

        return best_profile, best_score


# Global singleton instance
bank_registry = BankProfileRegistry()
