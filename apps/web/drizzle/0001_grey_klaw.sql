PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`status` text NOT NULL,
	`step` text DEFAULT 'queued' NOT NULL,
	`error_message` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`delete_after` integer NOT NULL,
	`post_text` text,
	`job_titles_json` text,
	`template_id` text NOT NULL,
	`theme_id` text NOT NULL,
	`aspect_ratio` text NOT NULL,
	`music_mode` text NOT NULL,
	`builtin_track_id` text,
	`upload_storage_path` text,
	`slide_plan_json` text,
	`output_video_path` text
);
--> statement-breakpoint
INSERT INTO `__new_jobs`("id", "session_id", "status", "step", "error_message", "created_at", "updated_at", "delete_after", "post_text", "job_titles_json", "template_id", "theme_id", "aspect_ratio", "music_mode", "builtin_track_id", "upload_storage_path", "slide_plan_json", "output_video_path") SELECT "id", "session_id", "status", "step", "error_message", "created_at", "updated_at", "delete_after", "post_text", NULL, "template_id", "theme_id", "aspect_ratio", "music_mode", "builtin_track_id", "upload_storage_path", "slide_plan_json", "output_video_path" FROM `jobs`;--> statement-breakpoint
DROP TABLE `jobs`;--> statement-breakpoint
ALTER TABLE `__new_jobs` RENAME TO `jobs`;--> statement-breakpoint
PRAGMA foreign_keys=ON;