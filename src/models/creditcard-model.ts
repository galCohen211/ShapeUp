import mongoose, { Schema, Document, Model, Types } from "mongoose";
import crypto from "crypto";

const algorithm = "aes-256-cbc";
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "01234567890123456789012345678901";
const IV_LENGTH = 16;

function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    algorithm,
    Buffer.from(ENCRYPTION_KEY, "utf8"),
    iv
  );
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

function decrypt(text: string): string {
  const [ivHex, encryptedHex] = text.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const encryptedText = Buffer.from(encryptedHex, "hex");
  const decipher = crypto.createDecipheriv(
    algorithm,
    Buffer.from(ENCRYPTION_KEY, "utf8"),
    iv
  );
  const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
  return decrypted.toString();
}

function encryptSetter(value: string): string {
  if (value?.startsWith("enc:")) return value;
  return "enc:" + encrypt(value);
}

function decryptGetter(value: string): string {
  return value?.startsWith("enc:") ? decrypt(value.slice(4)) : value;
}

export interface ICreditCard extends Document {
  user: Types.ObjectId;
  creditCardNumber: string;
  expirationDate: string;
  civ: string;
}

const CreditCardSchema = new Schema<ICreditCard>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    creditCardNumber: {
      type: String,
      required: true,
      set: encryptSetter,
      get: decryptGetter,
    },
    expirationDate: {
      type: String,
      required: true,
    },
    civ: {
      type: String,
      required: true,
      validate: {
        validator: (v: string) => /^\d{3}$/.test(v),
        message: (props) => `${props.value} is not a valid CIV; it should be exactly 3 digits.`,
      },
    },
  },
  {
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

const CreditCard: Model<ICreditCard> = mongoose.model("CreditCard", CreditCardSchema);
export default CreditCard;