import { act, type ReactTestInstance, type ReactTestRenderer } from "react-test-renderer";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount, deferred } from "@/test/react";
import { IngredientPresetPicker } from "./IngredientPresetPicker";
import { INGREDIENT_PRESET_CATEGORIES } from "@/lib/ingredientPresets";
import * as actions from "@/app/(app)/r/[restaurantId]/ingredients/actions";

vi.mock("@/app/(app)/r/[restaurantId]/ingredients/actions", () => ({
  addIngredientPresetAction: vi.fn(),
  removeIngredientPresetAction: vi.fn(),
  addIngredientPresetCategoryAction: vi.fn(),
  removeIngredientPresetCategoryAction: vi.fn(),
}));
vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

const category = { id: "custom", name: "House ingredients" };
const otherCategory = { id: "other", name: "Other category" };
const item = { id: "item", name: "House sauce", categoryKey: null, customCategoryId: category.id };
const otherItem = { ...item, id: "other-item", name: "Other sauce", customCategoryId: otherCategory.id };
let view: ReactTestRenderer;
const buttons = (label: string) => view.root.findAllByType("button").filter(b => b.children.join("") === label);
const button = (label: string) => { expect(buttons(label)).toHaveLength(1); return buttons(label)[0]; };
const input = (placeholder: string) => view.root.findByProps({ placeholder });
const addButton = (placeholder: string) => input(placeholder).parent!.findByType("button");
const click = async (node: ReactTestInstance) => { await act(async () => { await node.props.onClick(); }); };
const draft = async (placeholder: string, value: string) => {
  await act(async () => input(placeholder).props.onChange({ target: { value } }));
};

beforeEach(async () => {
  vi.resetAllMocks();
  view = await mount(IngredientPresetPicker, {
    restaurantId: "restaurant", customCategories: [category, otherCategory],
    customPresets: [item, otherItem], onPick: vi.fn(),
  });
  await click(button("browse"));
});

describe("IngredientPresetPicker additions", () => {
  for (const kind of ["item", "category"] as const) {
    const placeholder = kind === "item" ? "addPlaceholder" : "addCategoryPlaceholder";
    const action = kind === "item" ? actions.addIngredientPresetAction : actions.addIngredientPresetCategoryAction;
    it(`${kind}: releases busy after rejection, retains draft, and allows retry`, async () => {
      await click(button(category.name));
      await draft(placeholder, "  New entry  ");
      const pending = deferred<never>();
      vi.mocked(action).mockReturnValueOnce(pending.promise);
      let result!: Promise<unknown>;
      await act(async () => { result = addButton(placeholder).props.onClick(); });
      expect(addButton(placeholder).props.disabled).toBe(true);
      const rejection = expect(result).rejects.toThrow("offline");
      await act(async () => { pending.reject(new Error("offline")); await rejection; });
      expect(addButton(placeholder).props.disabled).toBe(false);
      expect(input(placeholder).props.value).toBe("  New entry  ");
      const created = { ...item, id: "new", name: "New entry" };
      vi.mocked(action).mockResolvedValueOnce(created);
      await click(addButton(placeholder));
      expect(action).toHaveBeenCalledTimes(2);
      if (kind === "item") {
        expect(action).toHaveBeenLastCalledWith("restaurant", { kind: "custom", id: category.id }, "New entry");
      } else {
        expect(action).toHaveBeenLastCalledWith("restaurant", "New entry");
        expect(buttons(item.name)).toHaveLength(0); // New category is active.
        expect(input("addPlaceholder")).toBeDefined();
      }
      expect(buttons("New entry")).toHaveLength(1);
      expect(input(placeholder).props.value).toBe("");
      expect(addButton(placeholder).props.disabled).toBe(true); // Empty draft.
    });

    it(`${kind}: a null result preserves the draft and releases busy`, async () => {
      await click(button(category.name));
      await draft(placeholder, "Unchanged");
      vi.mocked(action).mockResolvedValueOnce(null);
      await click(addButton(placeholder));
      expect(input(placeholder).props.value).toBe("Unchanged");
      expect(addButton(placeholder).props.disabled).toBe(false);
      expect(buttons("Unchanged")).toHaveLength(0);
    });
  }

  it("adds an item to a built-in category using its key", async () => {
    const builtin = INGREDIENT_PRESET_CATEGORIES[0];
    await click(button(builtin.label.en));
    await draft("addPlaceholder", "  Special ingredient  ");
    vi.mocked(actions.addIngredientPresetAction).mockResolvedValueOnce({
      ...item, name: "Special ingredient", categoryKey: builtin.key, customCategoryId: null,
    });
    await click(addButton("addPlaceholder"));
    expect(actions.addIngredientPresetAction).toHaveBeenCalledWith("restaurant", { kind: "builtin", key: builtin.key }, "Special ingredient");
    expect(buttons("Special ingredient")).toHaveLength(1);
  });
});

describe("IngredientPresetPicker optimistic deletion", () => {
  for (const fails of [false, true]) {
    it(`item: removes immediately and ${fails ? "restores on rejection" : "stays removed on success"}`, async () => {
      await click(button(category.name));
      const pending = deferred<void>();
      vi.mocked(actions.removeIngredientPresetAction).mockReturnValueOnce(pending.promise);
      let result!: Promise<void>;
      await act(async () => { result = button(item.name).parent!.findByProps({ "aria-label": "remove" }).props.onClick(); });
      expect(buttons(item.name)).toHaveLength(0);
      expect(actions.removeIngredientPresetAction).toHaveBeenCalledWith("restaurant", item.id);
      await act(async () => {
        if (fails) pending.reject(new Error("offline")); else pending.resolve();
        await result;
      });
      expect(buttons(item.name)).toHaveLength(fails ? 1 : 0);
      await click(button(otherCategory.name));
      expect(buttons(otherItem.name)).toHaveLength(1);
    });

    it(`active category: removes immediately and ${fails ? "restores category, items and selection" : "stays removed"}`, async () => {
      await click(button(category.name));
      const pending = deferred<void>();
      vi.mocked(actions.removeIngredientPresetCategoryAction).mockReturnValueOnce(pending.promise);
      let result!: Promise<void>;
      await act(async () => { result = button(category.name).parent!.findByProps({ "aria-label": "remove" }).props.onClick(); });
      expect(buttons(category.name)).toHaveLength(0);
      expect(buttons(item.name)).toHaveLength(0);
      expect(view.root.findAllByProps({ placeholder: "addPlaceholder" })).toHaveLength(0);
      expect(actions.removeIngredientPresetCategoryAction).toHaveBeenCalledWith("restaurant", category.id);
      await act(async () => {
        if (fails) pending.reject(new Error("offline")); else pending.resolve();
        await result;
      });
      expect(buttons(category.name)).toHaveLength(fails ? 1 : 0);
      expect(buttons(item.name)).toHaveLength(fails ? 1 : 0);
      await click(button(otherCategory.name));
      expect(buttons(otherItem.name)).toHaveLength(1);
    });
  }

  it("failed deletion of an inactive category preserves the current selection", async () => {
    await click(button(otherCategory.name));
    vi.mocked(actions.removeIngredientPresetCategoryAction).mockRejectedValueOnce(new Error("offline"));
    await click(button(category.name).parent!.findByProps({ "aria-label": "remove" }));
    expect(buttons(otherItem.name)).toHaveLength(1);
    expect(buttons(item.name)).toHaveLength(0);
    await click(button(category.name));
    expect(buttons(item.name)).toHaveLength(1);
  });
});
