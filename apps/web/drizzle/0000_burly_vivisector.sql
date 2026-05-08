CREATE TABLE `jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`status` text NOT NULL,
	`step` text DEFAULT 'queued' NOT NULL,
	`error_message` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`delete_after` integer NOT NULL,
	`post_text` text NOT NULL,
	`template_id` text NOT NULL,
	`theme_id` text NOT NULL,
	`aspect_ratio` text NOT NULL,
	`music_mode` text NOT NULL,
	`builtin_track_id` text,
	`upload_storage_path` text,
	`slide_plan_json` text,
	`output_video_path` text
);
