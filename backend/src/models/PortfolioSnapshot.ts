import mongoose, { Schema, Document } from 'mongoose';

export interface IPortfolioSnapshot extends Document {
    date: string;
    netWorthInr: number;
    investedInr: number;
    profitLossInr: number;
    userId: mongoose.Schema.Types.ObjectId;
    createdAt: Date;
}

const PortfolioSnapshotSchema: Schema = new Schema({
    date: { type: String, required: true },
    netWorthInr: { type: Number, required: true },
    investedInr: { type: Number, required: true },
    profitLossInr: { type: Number, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

PortfolioSnapshotSchema.index({ date: 1, userId: 1 }, { unique: true });

PortfolioSnapshotSchema.virtual('id').get(function (this: any) {
    return this._id.toHexString();
});

PortfolioSnapshotSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret: any) {
        delete ret._id;
    }
});

export const PortfolioSnapshot = mongoose.model<IPortfolioSnapshot>('PortfolioSnapshot', PortfolioSnapshotSchema);
