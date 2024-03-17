import mongoose from "mongoose";
import { Schema } from "mongoose";

const commandeSchema = new Schema({
  clientID: {
    type: Schema.Types.ObjectId,
    ref: "Client",
    required: [true, "Please precise the client who ordered"],
  },
  menuID: {
    type: Schema.Types.ObjectId,
    ref: "Menu",
    required: [true, "Please precise the menu ordered"],
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },
  quantity: {
    type: Number,
    default: 1,
  },
  date: {
    type: Date,
    default: Date.now,
  },

  address: {
    type: String,
    requied: [true, "Please precise the address of delivery"],
  },
  paymentPhoneNumber: {
    type: String,
    requied: [true, "Please precise the phone number for payment"],
  },
});

const CommandeModel = mongoose.model("Commande", commandeSchema);

export default CommandeModel;
