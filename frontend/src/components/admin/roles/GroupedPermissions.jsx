import React, { useRef } from "react";
import { OverlayPanel } from "primereact/overlaypanel";
import { IconButton } from "@mui/material";
import { MdOutlinePreview } from "react-icons/md";
import { CheckboxOverlay } from "../../utils/CrudComponents/InputsOverlay";

const GroupedPermissions = ({ formData, setFormData, permission }) => {
  const op = useRef(null);

  const groupBySubgroupString = (array) => {
    return array.reduce((result, item) => {
      const subgroup_string = item.subgroup_string || "No Group";
      const existing = result.find(
        (r) => r.subgroup_string === subgroup_string
      );
      if (existing) {
        existing.permissions.push({
          id: item.id,
          permission: item.permission,
        });
      } else {
        result.push({
          subgroup_string: subgroup_string,
          group: true,
          permissions: [
            {
              id: item.id,
              permission: item.permission,
            },
          ],
        });
      }
      return result;
    }, []);
  };


  let groupedCount = 0;

  return (
    <div>
      <div className="flex items-center">
        <IconButton
          style={{ paddingLeft: 0 }}
          onClick={(e) => {
            if (op?.current) {
              op.current.toggle(e);
            }
          }}
        >
          <MdOutlinePreview size={22} />
        </IconButton>
        <p
          style={{ fontSize: 14, fontWeight: 400, opacity: 0.8 }}
          onClick={(e) => {
            if (op?.current) {
              op.current.toggle(e);
            }
          }}
          className="hover:cursor-pointer"
        >
          {permission?.permission}
        </p>
      </div>
      <OverlayPanel ref={op}>
        <div className="flex flex-col">
          {groupBySubgroupString(permission?.permissions)?.map(
            (groupedPermission, groupedIndex) => {
              if (
                groupedPermission?.group &&
                groupedPermission?.subgroup_string != "No Group"
              ) {
                groupedCount += 1;
                return (
                  <div className="mb-3" key={"grouped"+groupedIndex}>
                    <div className="border-b pb-1 mb-1" style={{fontWeight: 500, fontSize: 14}}>
                      {groupedPermission?.subgroup_string}
                    </div>
                    {groupedPermission?.permissions?.map((p) => {
                      return (
                        <div key={p?.id} className="pl-2">
                          <CheckboxOverlay
                            formData={formData}
                            setFormData={setFormData}
                            name={`permission${p?.id}`}
                            labelText={p?.permission}
                          />
                        </div>
                      );
                    })}
                  </div>
                );
              }
            }
          )}
          {groupBySubgroupString(permission?.permissions)?.map(
            (groupedPermission, groupedIndex) => {
              if (
                groupedPermission?.group &&
                groupedPermission?.subgroup_string == "No Group"
              ) {
                return (
                  <div key={"ungrouped"+groupedIndex}>
                    {groupedCount > 0 &&
                      <div className="border-b  font-bold mb-1" />
                    }
                    {groupedPermission?.permissions?.map((p) => {
                      return (
                        <div key={p?.id} className="pl-2">
                          <CheckboxOverlay
                            formData={formData}
                            setFormData={setFormData}
                            name={`permission${p?.id}`}
                            labelText={p?.permission}
                          />
                        </div>
                      );
                    })}
                  </div>
                );
              }
            }
          )}
          {/* {permission?.permissions?.map((p)=>{
                    return (
                        <div key={p?.id}>
                            <CheckboxOverlay
                                formData={formData}
                                setFormData={setFormData}
                                name={`permission${p?.id}`}
                                labelText={p?.permission}
                            />
                        </div>
                    )
                })} */}
        </div>
      </OverlayPanel>
    </div>
  );
};

export default GroupedPermissions;
