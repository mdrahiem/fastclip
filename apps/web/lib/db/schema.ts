import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const jobs = sqliteTable("jobs", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  status: text("status", {
    enum: ["queued", "running", "complete", "failed"],
  }).notNull(),
  step: text("step").notNull().default("queued"),
  errorMessage: text("error_message"),
  createdAt: int("created_at").notNull(),
  updatedAt: int("updated_at").notNull(),
  deleteAfter: int("delete_after").notNull(),
  postText: text("post_text").notNull(),
  templateId: text("template_id").notNull(),
  themeId: text("theme_id").notNull(),
  aspectRatio: text("aspect_ratio", { enum: ["9:16", "16:9"] }).notNull(),
  musicMode: text("music_mode", { enum: ["builtin", "upload"] }).notNull(),
  builtinTrackId: text("builtin_track_id"),
  uploadStoragePath: text("upload_storage_path"),
  slidePlanJson: text("slide_plan_json"),
  outputVideoPath: text("output_video_path"),
});
