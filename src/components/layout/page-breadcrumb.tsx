import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"; 

interface PageBreadcrumbProps {
  currentPageName?: string;
  parentPage?: { name: string; href: string };
  grandparentPage?: { name: string; href: string };
}

const PageBreadcrumb: React.FC<PageBreadcrumbProps> = ({
  currentPageName,
  parentPage,
  grandparentPage,
}) => {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">首頁</BreadcrumbLink>
        </BreadcrumbItem>
        {grandparentPage && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={grandparentPage.href}>
                {grandparentPage.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
          </>
        )}
        {parentPage && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={parentPage.href}>
                {parentPage.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
          </>
        )}

        {currentPageName && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{currentPageName}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default PageBreadcrumb;
