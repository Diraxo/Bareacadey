import React, { useState } from "react";
import { AiFillDelete } from "react-icons/ai";
import { BiPlus } from "react-icons/bi";
import {A1, A2, A3, A4, A5, A6} from './avatars';
import './messages.scss';
import MessageDetail from "./MessageDetail";
import DeleteDialog from './DeleteConfirm';
import parse from 'html-react-parser'

const Email = () => {
    
    const [messages, setMessages] = useState([
      {
        id: 1,
        to: {name:"John Doe", url: A1, email: "johndoe@gmail.com"},
        subject: 'Meeting Request',
        message: 'Hi John, Could you please join the meeting tomorrow at 10 AM?',
        time: "feb 2",
        read: true,
      },
      {
        id: 2,
        to: {name: "Jane Doe", url: A2, email: "janedoe@gmail.com"},
        subject: 'Important Update',
        message: 'Dear Jane, Please find attached the latest update regarding the project.',
        time: "jan 28",
        read: false,
      },
      {
        id: 3,
        to: {name: "Robert Smith", url: A3, email: "robertsmith@gmail.com"},
        subject: 'Weekly Report',
        message: 'Hello Robert, Please find attached my weekly report for your review.',
        time: "jan 17",
        read: false,
      },
      {
        id: 4,
        to: {name: "Emily Johnson", url: A4, email: "emilyjohnson@gmail.com"},
        subject: 'Reminder',
        message: 'Hi Emily, Just a friendly reminder about the team meeting today at 2 PM.',
        time: "jan 12",
        read: true,
      },
      {
        id: 5,
        to: {name: "Michael Davis", url: A5, email: "michaeldavis@gmail.com"},
        subject: 'Job Application',
        message: 'Dear Michael, Thank you for your job application. We will get back to you soon.',
        time: "jan 8",
        read: true,
      },
      {
        id: 6,
        to: {name: "Sarah Smith", url: A6, email: "sarahsmith@gmail.com"},
        subject: 'Weekend Plans',
        message: 'Hey Sarah, Let\'s make some plans for this weekend. What do you say?',
        time: "jan 2",
        read: false,
      },
    ]);
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [allSelected, setAllSelected] = useState(false);

  const toggleSelectedEmail = (id) => {
    if (selectedEmails.includes(id)) {
      setSelectedEmails(selectedEmails.filter((email) => email !== id));
    } else {
      setSelectedEmails([...selectedEmails, id]);
    }
  };

  const toggleSelectAllEmails = () => {
    setAllSelected(!allSelected);
    setSelectedEmails(allSelected ? [] : messages.map((email) => email.id));
  };

  const deleteEmail = (id) => {
    setMessages(messages.filter(email => email.id !== id))
  }

  const handleDelete = () => {
    let sel = messages;
    //selectedEmails.forEach(id => sel.filter(email => email.id !== id))
    setMessages((prev)=>messages.filter(email => !selectedEmails.includes(email.id)))
    setSelectedEmails([])
  }

  const [showDetail, setShowDetail] = useState({show: false, message: {}});
  const handleCloseDetail = () => {
    setShowDetail({show: false, message: {}})
  }

  const [showDelete, setShowDelete] = useState(false)

  const handleDeleteClose = () => {
    setShowDelete(false)
  }


  return (
    <div className="p-4 card">
    <DeleteDialog open={showDelete} handleClose={handleDeleteClose} ids={showDetail.message.id} callBack={handleDelete} />
     
     {showDetail.show && 
       <MessageDetail message={showDetail.message} backClick={handleCloseDetail} deleteCallBack={deleteEmail}/>
     }
     {!showDetail.show && <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center px-4">
            <input
              type="checkbox"
              className="form-checkbox text-indigo-600 input-checkbox"
              checked={allSelected}
              onChange={toggleSelectAllEmails}
              style={{width: 20, height: 20, border: '2px solid #848189'}}
            />
            
          </div>
          <div className="flex">
            <button
              className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 mr-2"
              onClick={()=>setShowAdd(true)}
            >
              <BiPlus />
            </button>
            <button
              disabled={selectedEmails.length === 0}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${selectedEmails.length === 0 ? "bg-gray-300" : "bg-indigo-600"} text-white hover:bg-indigo-700`}
              onClick={()=>setShowDelete(true)}
            >
              <AiFillDelete />
            </button>
          </div>
        </div>
        
        <table className="mt-4 w-full border-collapse table-email">
          <tbody>
            {messages.length <= 0 &&
               <tr style={{marginTop: 100}} align="center">
                   <td style={{marginTop: 100}}>No Record</td>
               </tr>
            }
            {messages.map((email) => (
              <tr key={email.id}
                className={`border-b dark:border-gray-700 ${!email.read ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                onClick={()=>{
                  setShowDetail({show: true, message: email})
                }}
              >
                <td className="px-4 py-2 checkbox">
                  <input
                    type="checkbox"
                    className="form-checkbox text-indigo-600"
                    checked={selectedEmails.includes(email.id)}
                    onChange={(e) => {
                      toggleSelectedEmail(email.id);
                    }}
                    onClick={(e)=>e.stopPropagation()}
                    style={{width: 20, height: 20, border: '2px solid #848189'}}
                  />
                </td>
                <td className="px-4 py-2 name" width="100">
                    <div className="flex items-center">
                      <img src={email.to.url} width="40" height="40" className="rounded-full mr-2"/>
                      <p className={`${!email.read ? 'text-bold-main' : ''}`}>{email.to.name}</p>
                    </div>
                </td>
                <td className="px-4 py-2 message hidden sm:table-cell">
                  <div>
                    <p className="truncate">
                      <p className={`truncate ${!email.read ? 'text-bold-desc' : ''}`}>{email.subject}</p>
                      {/* <p className={`truncate ${!email.read ? 'text-bold-desc' : ''}`}>{parse(email.message)}</p> */}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-2 time" align="right">
                  <p className="">{email.time}</p>
                </td>
              </tr>
              ))}
    </tbody>
  </table>
</div>}
</div>
);
}

export default Email;
