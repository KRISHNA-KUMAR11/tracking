import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

@Schema()
export class PackageDetails extends Document {
  @Prop({
    required: true,
    validate: {
      validator: (v: string) => /^[A-Za-z\s]+$/.test(v),
      message: (props: any) =>
        `${props.value} is not a valid name! Only letters and spaces are allowed.`,
    },
  })
  SenderName: string;

  @Prop({
    required: true,
    validate: {
      validator: (v: string) => /^[A-Za-z\s]+$/.test(v),
      message: (props: any) =>
        `${props.value} is not a valid name! Only letters and spaces are allowed.`,
    },
  })
  Origin: string;

  @Prop({
    required: true,
    validate: {
      validator: (v: string) => /^[A-Za-z\s]+$/.test(v),
      message: (props: any) =>
        `${props.value} is not a valid name! Only letters and spaces are allowed.`,
    },
  })
  Destination: string;

  @Prop({
    required: true,
    enum: ['pending', 'in-transit', 'delivered', 'not delivered'],
  })
  Status: string;

  @Prop({
    required: true,
    validate: {
      validator: (v: number) =>
        /^\d+(\.\d{1,2})?$/.test(v.toFixed(2)) && v > 0 && v <= 1000,
      message: (props: any) =>
        `${props.value} must be a weight in kilograms with up to 2 decimal places.`,
    },
    get: (v: number) => `${v.toFixed(2)} kg`,
    set: (v: number) => parseFloat(v.toFixed(2)),
  })
  Package_weight: number;

  @Prop({
    required: true,
    validate: {
      validator: (v: number) => /^\d+(\.\d{1,2})?$/.test(v.toFixed(2)) && v > 0,
      message: (props: any) =>
        `${props.value} is not a valid price! Must be a positive number.`,
    },
    get: (v: number) => `$${v.toFixed(2)}`,
    set: (v: number) => parseFloat(v.toFixed(2)),
  })
  Price: number;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipient',
    required: true,
  })
  RecipientId: string;

  @Prop({ type: String })
  Description: string;

  @Prop({ unique: true })
  TrackingNumber: number;

  @Prop({ default: () => new Date() })
  Send_Date: Date;

  @Prop({
    type: {
      data: {
        type: Buffer,
        default: Buffer.alloc(0),
      },
      contentType: {
        type: String,
        enum: [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'application/pdf',
          'No IDProof',
        ],
        default: 'No IDProof',
      },
      size: {
        type: Number,
        default: 0,
        validate: {
          validator: function (v: number) {
            return v <= 5 * 1024 * 1024; // 5 MB limit
          },
          message: 'File size must be less than 5 MB.',
        },
      },
    },
  })
  ID_proof: {
    data: Buffer;
    contentType: string;
    size: number;
  };
}

export const PackageDetailsSchema =
  SchemaFactory.createForClass(PackageDetails);

// 🔄 Pre-save hook to auto-generate the TrackingNumber
PackageDetailsSchema.pre('save', async function (next) {
  const doc = this as any;

  if (!doc.isNew) return next();

  try {
    const lastPackage = await doc.constructor
      .findOne()
      .sort({ TrackingNumber: -1 })
      .exec();
    const nextTrackingNumber = lastPackage ? lastPackage.TrackingNumber + 1 : 1;
    doc.TrackingNumber = nextTrackingNumber;
    next();
  } catch (err) {
    next(err);
  }
});
