import React, { useState } from 'react';
import { FaBars, FaTimes } from 'react-icons/fa';

const NavComponent = ({ selectedNav, setSelectedNav, md, style }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navItems = ["Home", "All Courses", "About", "Contact Us"];

    const handleNavClick = (nav) => {
        setSelectedNav({ [nav]: true });
        localStorage.setItem("nav",nav)
        setIsMenuOpen(false); // Close menu after selection
    };

    return (
        <div>
            {md ? (
                <div className='flex justify-between items-center p-4 border-b'>
                    <img src="/bare-logo.png" width={34} height={40} alt="Bare Academy" />
                    <div onClick={() => setIsMenuOpen(!isMenuOpen)} className='hover:cursor-pointer'>
                        {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
                    </div>
                </div>
            ) : (
                <div className='flex justify-start w-full mt-9 pr-3 pl-6 -ml-3 border' style={{ backgroundColor: style?.secondaryBackground }}>
                    {
                        navItems?.map((nav, ind) => {
                            return selectedNav[nav] ?
                                (
                                    <div key={ind} className="flex justify-center items-center rounded-sm px-3 hover:cursor-pointer">
                                        <div className=' py-3 px-1' style={{ borderBottomWidth: 3, borderBottomColor: style?.backgroundColor, borderRadius: 3 }}>
                                            <p className='text-xl'>{nav}</p>
                                        </div>
                                    </div>
                                )
                                : (
                                    <div
                                        onClick={() => {
                                            setSelectedNav({
                                                [nav]: true
                                            })
                                            localStorage.setItem("nav",nav)
                                        }}
                                        key={ind} className="flex justify-center py-3 items-center rounded-sm px-4 hover:bg-[#1ea966] hover:text-white hover:cursor-pointer">
                                        <p className='text-xl'>{nav}</p>
                                    </div>
                                )
                        })
                    }
                </div>
            )}
            {md && isMenuOpen && (
                <div className='flex flex-col gap-2 items-center mt-4 py-2 space-y-4w-full border rounded' style={{ backgroundColor: style?.secondaryBackground }}>
                    {navItems.map((nav, ind) => (
                        <div
                            key={ind}
                            className={`w-fit px-2 flex justify-center py-3 hover:cursor-pointer rounded ${selectedNav[nav] ? 'border-b-3' : 'hover:bg-[#1ea966] hover:text-white'}`}
                            style={selectedNav[nav] ? { borderBottomWidth: 3, borderBottomColor: style?.backgroundColor } : {}}
                            onClick={() => handleNavClick(nav)}
                        >
                            <p className='text-xl'>{nav}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NavComponent;
