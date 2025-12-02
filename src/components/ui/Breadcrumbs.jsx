import React, { useState, useEffect } from "react";
import { useLocation, NavLink } from "react-router-dom";
import { menuItems } from "@/constant/data";
import Icon from "@/components/ui/Icon";

const Breadcrumbs = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter((item) => item);
  const queryParams = new URLSearchParams(location.search);
  const name = queryParams.get("name");

  const [isHide, setIsHide] = useState(null);
  const [groupTitle, setGroupTitle] = useState("");

  useEffect(() => {
    const currentMenuItem = menuItems.find(
      (item) => item.link === location.pathname
    );

    const currentChild = menuItems.find((item) =>
      item.child?.find((child) => child.childlink === location.pathname)
    );

    if (currentMenuItem) {
      setIsHide(currentMenuItem.isHide);
    } else if (currentChild) {
      setIsHide(currentChild?.isHide || false);
      setGroupTitle(currentChild?.title);
    }
  }, [location]);

  return (
    <>
      {!isHide ? (
        <div className="md:mb-6 mb-4 flex space-x-3 rtl:space-x-reverse">
          <ul className="breadcrumbs">
            <li className="text-primary-500">
              <NavLink to="/dashboard" className="text-lg">
                <Icon icon="heroicons-outline:home" />
              </NavLink>
              <span className="breadcrumbs-icon rtl:transform rtl:rotate-180">
                <span className="mx-2">
                  <Icon icon="heroicons:chevron-right" />
                </span>
              </span>
            </li>
            {pathSegments.map((segment, index) => (
              <li key={index} className="text-primary-500">
                {index === 0 ? (
                  <span className="capitalize">{segment.replace("calendar", "Calendar")}</span>
                ) : (
                  <span className="capitalize">{segment}</span>
                )}
                {index < pathSegments.length - 1 && (
                  <span className="breadcrumbs-icon rtl:transform rtl:rotate-180">
                    <span className="mx-2">
                      <Icon icon="heroicons:chevron-right" />
                    </span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );
};

export default Breadcrumbs;
