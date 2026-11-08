import React, { useState } from "react";
import { FiPhone } from "react-icons/fi";
import { LegalLinks } from "../../../legal/LegalLayout";

import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { BsFilterLeft } from "react-icons/bs";
import { FaRegUser, FaUser } from "react-icons/fa";
import CoursesFrontend from "./CoursesFrontend";
import HomeFrontend from "./HomeFrontend";
import { useNavigate } from "react-router-dom";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

import { useSelector } from "react-redux";
import UserDropdownLandingPage from "./UserDropdownLandingPage";
import NavComponent from "./NavComponent";
import AboutUs from "./AboutUs";
import ContactUs from "./ContactUs";

const MainPage = ({ style, screenSizes, categories, courses, coursesLoading = false, coursesError = false, onRetryCourses }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const md = useMediaQuery(theme.breakpoints.down("md"));

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const user = useSelector((state) => state?.auth?.user);

  const navItems = ["Home", "All Courses", "About", "Contact Us"];
  const nav = localStorage?.getItem("nav") ? localStorage?.getItem("nav") : "Home";
 
  const [selectedNav, setSelectedNav] = useState({ [nav]: true });

  const CategoriesComponent = () => {
    return (
      <div>
        {selectedNav["All Courses"] && !md && (
          <div style={{ width: 300 }}>
            <div
              className="flex flex-col mr-3 border  rounded-lg"
              style={{ minWidth: 200 }}
            >
              <div className="flex gap-3 p-3 text-whitne border-b py-4 rounded-t">
                <BsFilterLeft size={25} fontWeight={700} />
                <p className="text-xl font-bold">All Categories</p>
              </div>
              <div style={{}}>
                <div
                  className={`flex justify-between items-center border-b p-2 pl-3 hover:cursor-pointer ${
                    selectedCategory == ""
                      ? "bg-[#1ea966] text-white"
                      : "hover:bg-[rgba(0,255,0,.1)] hover:text-black"
                  }`}
                  style={{}}
                  onClick={() => {
                    setSelectedCategory("");
                  }}
                >
                  <p className="text-lg">All</p>
                  <p
                    className="text-md bg-[#1ea966] opacity-60 p-2 rounded-full flex items-center justify-center text-white"
                    style={{ width: 20, height: 20 }}
                  >
                    {courses?.length || 0}
                  </p>
                </div>
                {categories?.map((cat, ind) => {
                  // if(cat?.coursesCount == 0) return;
                  return (
                    <div
                      key={cat?.name + ind}
                      className={`flex justify-between items-center border-b p-2 pl-3 hover:cursor-pointer ${
                        selectedCategory == cat?.id
                          ? "bg-[#1ea966] text-white"
                          : "hover:bg-[rgba(0,255,0,.1)] hover:text-black"
                      }`}
                      style={{}}
                      onClick={() => {
                        setSelectedCategory(cat?.id);
                      }}
                    >
                      <p className="text-lg">{cat?.name}</p>
                     {cat?.coursesCount > 0 &&
                     <p
                        className="text-md bg-[#1ea966] opacity-60 p-2 rounded-full flex items-center justify-center text-white"
                        style={{ width: 20, height: 20 }}
                      >
                        {cat?.coursesCount || 0}
                      </p>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  const CategoryItem = ({ label, count, selected, onClick }) => (
    <div
      className={`flex justify-between items-center px-4 py-3 cursor-pointer transition-all duration-300 border-b 
        ${selected ? "bg-indigo-600 text-white" : "hover:bg-indigo-50 text-gray-700"}`}
      onClick={onClick}
    >
      <p className="text-base font-medium">{label}</p>
      {count > 0 && (
        <span className="text-sm font-semibold bg-indigo-500 text-white px-2 py-1 rounded-full">
          {count}
        </span>
      )}
    </div>
  );
  
  return (
    <div
      className="flex flex-col items-center bg-white"
      style={{ color: "#524e58" }}
    >
      <div
        style={{
          backgroundColor: style?.backgroundColor,
          color: "white",
          height: 30,
          width: "100%",
        }}
        className="flex justify-center"
      >
        {!screenSizes?.md && (
          <div
            style={{ maxWidth: style?.maxWidth }}
            className="flex justify-between items-center w-full px-10"
          >
            <p style={{ fontWeight: 500, fontSize: 15 }}>
              Welcome to Bare Academy
            </p>
            <div className="flex items-center gap-2">
              <FiPhone size={15} />
              <p>+252633283454</p>
            </div>
          </div>
        )}
      </div>
      <div
        className={`flex justify-left mt-4 ${
          screenSizes?.xs ? "px-2" : "px-10"
        } w-full`}
        style={{ minHeight: "100vh", maxWidth: style?.maxWidth }}
      >
        <div className="w-full">
          <div className="flex flex-col"></div>

          <div className="flex flex-col ">
            {/* header section (logo, search, ...) */}
            <div className="">
              <div className="flex justify-between items-center gap-10 w-full">
                {!md && (
                  <div className="flex items-center gap-3">
                    <img src="/bare-logo.png" width={42} height={50} alt="Bare Academy" />
                    <p className="text-4xl font-bold text-[#1ea966]">
                      {!screenSizes?.xl ? "BARE ACADEMY" : "BARE"}
                    </p>
                    {/* <p className='text-4xl font-bold bg-[#1ea966] text-white p-2 rounded px-4'>ACADEMY</p> */}
                  </div>
                )}
                {/* {!selectedNav["All Courses"] && !md && <div className='icon'>
                            <p style={{ fontSize: 25, color: style?.backgroundColor, fontWeight: 700 }}>Bare Academy</p>
                        </div>} */}
                <div
                  className="p-inputgroup search_input_field_group"
                  style={{ height: 42, maxWidth: 600 }}
                >
                  <InputText
                    onChange={(e) => {
                      setSearch(e.target.value);
                    }}
                    placeholder="Search"
                    className="pl-3 search_input_field"
                    style={{
                      borderWidth: "2px 1px 2px 2px",
                      borderColor: `${style?.backgroundColor}`,
                      borderRadius: "5px 0 0 5px",
                    }}
                  />
                  {!screenSizes?.md && (
                    <Dropdown
                      value={selectedCategory}
                      optionValue="id"
                      onChange={(e) => setSelectedCategory(e.value)}
                      options={categories}
                      panelClassName="py-1 px-1 shadow-2 h-fit"
                      panelStyle={{
                        marginLeft: 1.5,
                        backgroundColor: style?.secondaryBackground,
                      }}
                      itemTemplate={(item) => {
                        return (
                          <p
                            className={`py-1 text-lg rounded pl-2 hover:bg-[#1ea966] hover:text-[white] hover:shadow-2`}
                          >
                            {item?.name}
                          </p>
                        );
                      }}
                      optionLabel="name"
                      placeholder="Categories"
                      className="search_dropdown flex items-center -ml-1"
                      style={{
                        maxWidth: 150,
                        paddingLeft: 15,
                        paddingRight: 10,
                        borderColor: `${style?.backgroundColor}`,
                        borderWidth: "2px 0",
                      }}
                    />
                  )}
                  <Button
                    icon="pi pi-search"
                    className="p-button-warning p-2 px-4 text-white"
                    style={{
                      backgroundColor: style?.backgroundColor,
                      fontWeight: "bold",
                      borderRadius: "0 5px 5px 0",
                    }}
                  />
                </div>

                <div className="flex items-center justify-center gap-3">
                  {!user && (
                    <div
                      style={{
                        backgroundColor: style?.backgroundColor,
                        paddingTop: 3,
                        paddingBottom: 4,
                      }}
                      className="px-4 rounded-full text-white font-bold flex items-center justify-center gap-2 hover:cursor-pointer"
                      onClick={() => {
                        navigate("/auth/login");
                      }}
                    >
                      <FaUser size={15} style={{ marginTop: 1 }} />
                      <span className="text-lg">
                        {user ? "Admin" : "Login"}
                      </span>
                    </div>
                  )}
                  {user && <UserDropdownLandingPage md={md} />}
                </div>
              </div>
            </div>

            <NavComponent
              selectedNav={selectedNav}
              setSelectedNav={setSelectedNav}
              md={md}
              style={style}
            />
          </div>

          <div className="mt-4 p-0">
            {selectedNav["All Courses"] && (
              <div className={`${screenSizes?.xs ? "" : "p-4"}}`}>
                <div className="flex gap-3">
                  <CategoriesComponent />
                  <div className="w-full">
                    <CoursesFrontend
                      courses={courses}
                      style={style}
                      screenSizes={screenSizes}
                      search={search}
                      selectedCategory={selectedCategory}
                      loading={coursesLoading}
                      error={coursesError}
                      onRetry={onRetryCourses}
                    />
                  </div>
                </div>
              </div>
            )}
            {selectedNav["Home"] && (
              <div className="p-4">
                <HomeFrontend
                  courses={courses}
                  coursesLoading={coursesLoading}
                  style={style}
                  screenSizes={screenSizes}
                  search={search}
                  selectedCategory={selectedCategory}
                />
              </div>
            )}

            {selectedNav["About"] && (
              <div className="">
                <AboutUs />
              </div>
            )}

            {selectedNav["Contact Us"] && (
              <div className="">
                <ContactUs />
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="w-full py-4 border-t" style={{ borderColor: "#e5e7eb" }}>
        <LegalLinks />
      </div>
    </div>
  );
};

export default MainPage;
