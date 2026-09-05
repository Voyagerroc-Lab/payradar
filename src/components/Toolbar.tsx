import { CATEGORIES } from "../lib/format";
import type { CategoryId } from "../types";
import { useI18n } from "../i18n";
import type { TranslationKey } from "../i18n/dict";
import { Icon } from "./icons";

export type SortKey = "date" | "price-desc" | "name";

interface ToolbarProps {
  query: string;
  onQueryChange: (q: string) => void;
  category: CategoryId | "all";
  onCategoryChange: (c: CategoryId | "all") => void;
  sort: SortKey;
  onSortChange: (s: SortKey) => void;
  onAdd: () => void;
}

export default function Toolbar({
  query,
  onQueryChange,
  category,
  onCategoryChange,
  sort,
  onSortChange,
  onAdd,
}: ToolbarProps) {
  const { t } = useI18n();

  return (
    <section className="toolbar">
      <input
        className="input search"
        type="search"
        name="search"
        aria-label={t("toolbar.searchPlaceholder")}
        placeholder={t("toolbar.searchPlaceholder")}
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
      />

      <div className="chips" aria-label={t("form.category")}>
        <button
          className={`chip-btn ${category === "all" ? "active" : ""}`}
          aria-pressed={category === "all"}
          onClick={() => onCategoryChange("all")}
        >
          {t("filter.all")}
        </button>
        {(Object.keys(CATEGORIES) as CategoryId[]).map((id) => (
          <button
            key={id}
            className={`chip-btn ${category === id ? "active" : ""}`}
            aria-pressed={category === id}
            onClick={() => onCategoryChange(id)}
          >
            <Icon name={CATEGORIES[id].icon} size={13} />{" "}
            {t(CATEGORIES[id].labelKey as TranslationKey)}
          </button>
        ))}
      </div>

      <div className="toolbar-right">
        <select
          className="input select"
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortKey)}
          aria-label={t("sort.label")}
        >
          <option value="date">{t("sort.date")}</option>
          <option value="price-desc">{t("sort.priceDesc")}</option>
          <option value="name">{t("sort.name")}</option>
        </select>
        <button className="btn btn-primary" onClick={onAdd}>
          {t("action.addPayment")}
        </button>
      </div>
    </section>
  );
}

