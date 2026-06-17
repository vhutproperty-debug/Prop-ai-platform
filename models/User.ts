import { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    phone: { type: String },
    role: {
      type: String,
      enum: ["user", "agent", "builder", "admin"],
      default: "user",
    },
    avatar: { type: String },
    preferences: {
      budget: { min: Number, max: Number },
      localities: [{ type: String }],
      configurations: [{ type: String }],
    },
  },
  { timestamps: true }
);

export const User = models.User || model("User", UserSchema);
