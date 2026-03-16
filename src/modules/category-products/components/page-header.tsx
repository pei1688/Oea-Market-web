interface PageHeaderProps {
  categorySlug?: string;
  totalCount: number;
  isPending: boolean;
  activeFilters?: {
    categories: string[];
    brands: string[];
  };
}

const PageHeader = ({
  categorySlug,
  totalCount,
  isPending,
  activeFilters = { categories: [], brands: [] },
}: PageHeaderProps) => {
  // 決定顯示的標題
  const getDisplayTitle = () => {
    const categoryCount = activeFilters?.categories?.length || 0;
    const brandCount = activeFilters?.brands?.length || 0;

    // 如果分類和品牌都選擇複數個，顯示"全部"
    if (categoryCount > 1 && brandCount > 1) {
      return "全部";
    }

    // 如果只有分類過濾器
    if (categoryCount > 0 && brandCount === 0) {
      if (categoryCount === 1) {
        return decodeURIComponent(activeFilters.categories[0]);
      } else {
        return "全部";
      }
    }

    // 如果只有品牌過濾器
    if (brandCount > 0 && categoryCount === 0) {
      if (brandCount === 1) {
        return `${decodeURIComponent(activeFilters.brands[0])} 品牌商品`;
      } else {
        return "全部";
      }
    }

    // 如果分類和品牌都只選擇一個
    if (categoryCount === 1 && brandCount === 1) {
      return `${decodeURIComponent(activeFilters.categories[0])} - ${decodeURIComponent(activeFilters.brands[0])}`;
    }

    // 如果分類選擇一個，品牌選擇多個
    if (categoryCount === 1 && brandCount > 1) {
      return "全部";
    }

    // 如果分類選擇多個，品牌選擇一個
    if (categoryCount > 1 && brandCount === 1) {
      return "全部";
    }

    // 回退到原始的 categorySlug 或默認標題
    return categorySlug ? decodeURIComponent(categorySlug) : "所有商品";
  };

  return (
    <div>
      <h1 className="ae-section-title">{getDisplayTitle()}</h1>
      <p className="mt-1 ae-caption">
        {isPending ? "載入中..." : `${totalCount} 項商品`}
      </p>
    </div>
  );
};

export default PageHeader;
