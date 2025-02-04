import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Recipient extends Document {
  @Prop({
    required: true,
    validate: {
      validator: function (v: string) {
        return /^[A-Za-z\s]+$/.test(v);
      },
      message: (props: { value: string }) =>
        `${props.value} is not a valid name! Only letters and spaces are allowed.`,
    },
  })
  RecipientName: string;

  @Prop({
    required: true,
    validate: {
      validator: function (v: string) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(v);
      },
      message: (props: { value: string }) =>
        `${props.value} is not a valid email address`,
    },
  })
  RecipientEmail: string;

  @Prop({
    required: [true, 'RecipientContact is required'],
    validate: {
      validator: function (v: number) {
        return v.toString().length >= 10 && v.toString().length <= 15;
      },
      message: (props: { value: number }) =>
        `${props.value} is not a valid phone number. Must be 10 to 15 digits long`,
    },
  })
  RecipientContact: number;

  @Prop({
    required: true,
    minlength: [10, 'Address must be at least 10 characters long'],
    maxlength: [100, 'Address cannot exceed 100 characters'],
    validate: {
      validator: function (v: string) {
        const addressRegex = /^[a-zA-Z0-9\s,.'-]+$/;
        return addressRegex.test(v);
      },
      message: (props: { value: string }) =>
        `${props.value} is not a valid address format`,
    },
  })
  Address: string;

  @Prop({
    type: {
      data: {
        type: Buffer,
        default: Buffer.alloc(0),
      },
      contentType: {
        type: String,
        enum: {
          values: [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'application/pdf',
            'No IDProof',
          ],
          message: 'Only JPEG, PNG, GIF, WebP, and PDF formats are allowed.',
        },
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

export const RecipientSchema = SchemaFactory.createForClass(Recipient);
