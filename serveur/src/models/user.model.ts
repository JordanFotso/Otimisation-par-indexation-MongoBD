import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  status: "active" | "inactive" | "pending";
  createdAt: Date;
  metadata: Record<string, any>;
}

const baseSchema = {
  email: { type: String, required: true },
  status: { type: String, enum: ["active", "inactive", "pending"], required: true },
  createdAt: { type: Date, default: Date.now },
  metadata: { type: Object, default: {} }
};

// 1. Schéma sans aucun index
const schemaNoIndex = new Schema<IUser>(baseSchema);

// 2. Schéma avec index simple sur l'email
const schemaSingleIndex = new Schema<IUser>(baseSchema);
schemaSingleIndex.index({ email: 1 });

// 3. Schéma avec index composé (status + createdAt + email)
const schemaCompoundIndex = new Schema<IUser>(baseSchema);
schemaCompoundIndex.index({ status: 1, createdAt: -1, email: 1 });

export const UserNoIndex = model<IUser>("UserNoIndex", schemaNoIndex, "users_no_index");
export const UserSingleIndex = model<IUser>("UserSingleIndex", schemaSingleIndex, "users_single_index");
export const UserCompoundIndex = model<IUser>("UserCompoundIndex", schemaCompoundIndex, "users_compound_index");
