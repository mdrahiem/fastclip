import type { ThemePack } from "@video-gen/contracts";
import { getThemeById } from "@video-gen/contracts";

/**
 * Test data for We Are Hiring template
 * Uses 4 fixed job positions for testing
 */

export type WeAreHiringData = {
  positions: [string, string, string, string];
  theme: ThemePack;
};

export const TEST_HIRING_DATA_1: WeAreHiringData = {
  positions: [
    "Frontend Developer",
    "Backend Developer",
    "Data Engineer",
    "Product Manager",
  ],
  theme: getThemeById("graph-paper-v1"),
};

export const TEST_HIRING_DATA_2: WeAreHiringData = {
  positions: [
    "Senior React Developer",
    "Kotlin Developer",
    "Data Platform Engineer",
    "Business Manager - IT/Engineering (Dutch)",
  ],
  theme: getThemeById("graph-paper-v1"),
};

export const TEST_HIRING_DATA_3: WeAreHiringData = {
  positions: [
    "UI/UX Designer",
    "DevOps Engineer",
    "Machine Learning Engineer",
    "Sales Manager",
  ],
  theme: getThemeById("graph-paper-v1"),
};

export const HIRING_VIDEO_DURATION_SECONDS = 15; // 15 second video
