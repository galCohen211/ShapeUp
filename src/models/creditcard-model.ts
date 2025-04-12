import mongoose, { Schema, Document, Model } from "mongoose";
import crypto from "crypto";

const algorithm = "aes-256-cbc";
const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || "01234567890123456789012345678901";
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

// Decryption function: given a string in format iv:encrypted, it returns the decrypted plaintext.
function decrypt(text: string): string {
  const textParts = text.split(":");
  const iv = Buffer.from(textParts[0], "hex");
  const encryptedText = Buffer.from(textParts[1], "hex");
  const decipher = crypto.createDecipheriv(
    algorithm,
    Buffer.from(ENCRYPTION_KEY, "utf8"),
    iv
  );
  const decrypted = Buffer.concat([
    decipher.update(encryptedText),
    decipher.final(),
  ]);
  return decrypted.toString();
}

// Setter that will encrypt the credit card number before saving.
// Adds a prefix "enc:" so we know this field is encrypted.
function encryptSetter(value: string): string {
  if (value && value.startsWith("enc:")) {
    // If already encrypted, do nothing.
    return value;
  }
  return "enc:" + encrypt(value);
}

// Getter that will decrypt the credit card number when reading it.
function decryptGetter(value: string): string {
  if (value && value.startsWith("enc:")) {
    return decrypt(value.substring(4));
  }
  return value;
}

export interface ICreditCard extends Document {
  creditCardNumber: string;
  expirationDate: string;
  civ: string;
  cardOwnerName: string;
}

const CreditCardSchema: Schema<ICreditCard> = new mongoose.Schema(
  {
    creditCardNumber: {
      type: String,
      required: true,
      set: encryptSetter,
      get: decryptGetter,
    },
    expirationDate: { type: String, required: true },
    civ: {
      type: String,
      required: true,
      validate: {
        validator: function (v: string) {
          return /^\d{3}$/.test(v);
        },
        message: (props: any) =>
          `${props.value} is not a valid CIV; it should be exactly 3 digits.`,
      },
    },
    cardOwnerName: { type: String, required: true },
  },
  {
    // Enable getters when converting to JSON/Objects.
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

const CreditCard: Model<ICreditCard> = mongoose.model<ICreditCard>(
  "CreditCard",
  CreditCardSchema
);
export default CreditCard;
