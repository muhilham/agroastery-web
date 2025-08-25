import * as React from "react";

const Category = React.forwardRef<
  HTMLDivElement,
  React.HtmlHTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={className} {...props} />
));

Category.displayName = "Category";

const CategoryBottomSheets = React.forwardRef<
  HTMLDivElement,
  React.HtmlHTMLAttributes<HTMLDivElement>
>(({ className }, ref) => <div ref={ref} className={className} />);

CategoryBottomSheets.displayName = "CategoryBottomSheets";

export { Category, CategoryBottomSheets };
