/**
 * Faked HTTP client standing in for axios/fetch against an external
 * inventory/warehouse service. Always "succeeds" but takes time, and
 * can be made to fail to demonstrate rollback semantics.
 */
export class WarehouseHttpClient {
  async reserveStock(payload: {
    isbn: string;
    quantity: number;
  }): Promise<{ reservationId: string }> {
    await new Promise((r) => setTimeout(r, 30));
    // Pretend the remote warehouse rejects ISBNs ending in '000'.
    if (payload.isbn.endsWith('000')) {
      throw new Error('Warehouse: out of stock');
    }
    return { reservationId: `res_${payload.isbn}_${payload.quantity}` };
  }
}
