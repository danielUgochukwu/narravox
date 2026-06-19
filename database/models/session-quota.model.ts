import { model, models, Schema } from "mongoose";

const SessionQuotaSchema = new Schema({
  clerkId: { type: String, required: true },
  billingPeriodStart: { type: Date, required: true },
  count: { type: Number, required: true, default: 0 },
});

SessionQuotaSchema.index({ clerkId: 1, billingPeriodStart: 1 }, { unique: true });

const SessionQuota = models.SessionQuota || model("SessionQuota", SessionQuotaSchema);
export default SessionQuota;
