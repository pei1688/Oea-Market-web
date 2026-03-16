import { getCollections } from "@/action/collection";
import CollectionItem from "../../components/collection-item";

const CollectionContent = async () => {
  const collections = await getCollections();
  return (
    <div className="mt-6 grid min-h-200 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {collections &&
        collections?.length > 0 &&
        collections.map((col) => <CollectionItem col={col} key={col.id} />)}
    </div>
  );
};

export default CollectionContent;
