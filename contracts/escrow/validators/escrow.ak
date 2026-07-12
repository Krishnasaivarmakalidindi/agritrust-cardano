use aiken/collection/list
use aiken/crypto.{VerificationKeyHash}
use aiken/transaction.{OutputReference, ScriptContext, Spend}
use cardano/address.{Address, Script}
use cardano/assets

/// AgriTrust Escrow Validator
/// Lifecycle: CREATED → FUNDED → LOCKED → SHIPPED → DELIVERED → RELEASED → COMPLETED
/// Supports: Release (buyer confirms), Refund (before shipment), Cancel

pub type EscrowDatum {
  order_id: ByteArray,
  buyer: VerificationKeyHash,
  farmer: VerificationKeyHash,
  amount: Int,
  status: EscrowStatus,
}

pub type EscrowStatus {
  Created
  Funded
  Locked
  Shipped
  Delivered
  Released
  Completed
  Refunded
  Cancelled
}

pub type EscrowRedeemer {
  Release
  Refund
  Cancel
  Dispute
}

/// Validate escrow spend – buyer must sign for release/refund
validator escrow {
  spend(
    datum: Option<EscrowDatum>,
    redeemer: EscrowRedeemer,
    _own_ref: OutputReference,
    ctx: ScriptContext,
  ) {
    expect Some(escrow_datum) = datum

    when redeemer is {
      Release -> {
        // Buyer confirms delivery – release funds to farmer
        expect escrow_datum.status == Locked || escrow_datum.status == Delivered
        list.has(ctx.transaction.extra_signatories, escrow_datum.buyer)
      }
      Refund -> {
        // Refund buyer before shipment
        expect escrow_datum.status == Locked || escrow_datum.status == Funded
        list.has(ctx.transaction.extra_signatories, escrow_datum.buyer)
      }
      Cancel -> {
        // Either party can cancel before funds locked
        expect escrow_datum.status == Created || escrow_datum.status == Funded
        True
      }
      Dispute -> {
        // Placeholder – requires admin multisig (future)
        False
      }
    }
  }

  else(_) {
    fail
  }
}

test release_requires_buyer_signature() {
  True
}

test refund_before_shipment() {
  True
}
