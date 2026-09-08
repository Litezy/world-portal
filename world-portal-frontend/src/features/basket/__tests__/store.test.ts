import { beforeEach, describe, expect, it } from "vitest";

import {
  type BasketItem,
  basketTotal,
  hasUnpricedItems,
  useBasketStore,
} from "@/features/basket/store";

const pro = (id: string, price: number | null = 100): BasketItem => ({
  id: `pro:${id}`,
  type: "pro",
  title: id,
  price,
});

describe("basket store", () => {
  beforeEach(() => useBasketStore.setState({ items: [] }));

  it("adds an item", () => {
    useBasketStore.getState().add(pro("elena"));
    expect(useBasketStore.getState().items).toHaveLength(1);
  });

  it("replaces rather than duplicates the same line", () => {
    useBasketStore.getState().add(pro("elena", 100));
    useBasketStore.getState().add(pro("elena", 250));

    const items = useBasketStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].price).toBe(250);
  });

  it("toggles an item off again", () => {
    const item = pro("kenji");
    useBasketStore.getState().toggle(item);
    expect(useBasketStore.getState().items).toHaveLength(1);

    useBasketStore.getState().toggle(item);
    expect(useBasketStore.getState().items).toHaveLength(0);
  });

  it("removes by id and clears everything", () => {
    useBasketStore.getState().add(pro("a"));
    useBasketStore.getState().add(pro("b"));
    useBasketStore.getState().remove("pro:a");
    expect(useBasketStore.getState().items.map((i) => i.id)).toEqual(["pro:b"]);

    useBasketStore.getState().clear();
    expect(useBasketStore.getState().items).toHaveLength(0);
  });
});

describe("basketTotal", () => {
  it("sums the priced lines", () => {
    expect(basketTotal([pro("a", 280), pro("b", 240)])).toBe(520);
  });

  it("treats a not-yet-quoted line as zero rather than NaN", () => {
    // A visa fee is set after review; it must not poison the total.
    expect(basketTotal([pro("a", 280), pro("b", null)])).toBe(280);
  });

  it("is zero for an empty basket", () => {
    expect(basketTotal([])).toBe(0);
  });
});

describe("hasUnpricedItems", () => {
  it("flags a basket that is still awaiting a quote", () => {
    expect(hasUnpricedItems([pro("a", 280), pro("b", null)])).toBe(true);
    expect(hasUnpricedItems([pro("a", 280)])).toBe(false);
  });
});
