import { Schema, model, Document } from "mongoose";

export interface IMetric extends Document {
  strategy: string;
  latency: number;
  createdAt: Date;
}

const metricSchema = new Schema<IMetric>({
  strategy: { type: String, required: true },
  latency: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const Metric = model<IMetric>("Metric", metricSchema, "metrics_history");
