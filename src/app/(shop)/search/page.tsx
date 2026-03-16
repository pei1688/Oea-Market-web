import Spinner from "@/components/spinner";
import SearchContent from "@/modules/search/ui/view/search-content";
import { Suspense } from "react";

const SearchPage = () => {
  return (
    <Suspense fallback={<Spinner />}>
      <SearchContent />;
    </Suspense>
  );
};

export default SearchPage;
