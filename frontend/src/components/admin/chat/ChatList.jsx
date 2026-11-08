import { Avatar, Badge, Card, IconButton, InputAdornment, TextField } from '@mui/material';
import React, { useState } from 'react';
import { AiOutlineSearch } from 'react-icons/ai';
import { useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { useGetChatUsersQuery } from '../../../features/user/chatsApiSlice';
import { useSettings } from '../../../MuiTheme/hooks/useSettings';
import { MdClose } from 'react-icons/md';
import { styled } from '@mui/material/styles';

const ChatList = ({ selectedChat, setSelectedChat, absolute = false, setMenu, onlineUsers }) => {
  const theme = useTheme();
  const { settings } = useSettings();

  const currentUser = useSelector((state) => state?.auth?.user);
  const { data: chatUsers } = useGetChatUsersQuery();
  const mode = settings?.mode;

  const [searchTerm, setSearchTerm] = useState('');

  const BadgeContentSpan = styled('span')(({ theme, backgroundColor }) => ({
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: backgroundColor,
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
  }));

  // Filter chat users based on the search term
  const filteredChatUsers = chatUsers?.map((chatGroup) => ({
    ...chatGroup,
    users: chatGroup.users.filter((user) =>
      user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  })).filter((chatGroup) => chatGroup.users.length > 0);

  const colors = [
    "#0ea5e9",
    "#7c3aed",
    "#10b981",
    "#d97706",
    "#ef4444",
    "#d946ef",
    "#6366f1",
    "#047857",
    "#0284c7",
    "#be185d"
  ];
  
  return (
    <Card
      style={{ 
        borderRadius: settings?.mode == 'light' ? '5px 0 0 5px' : 0,
        maxHeight: '90vh',
        overflowY: "auto" 
      }}
    >
      <div
        className={`flex items-center gap-3 px-4 py-4 border-b ${
          settings?.mode == 'light' ? '' : 'border-gray-700'
        }`}
      >
        <Badge
          overlap="circular"
          sx={{ ml: 2, cursor: 'pointer' }}
          badgeContent={<BadgeContentSpan backgroundColor="#1ea966" />}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Avatar sx={{ width: 40, height: 40 }} src={currentUser?.img_url} />
        </Badge>
        <TextField
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <AiOutlineSearch />
              </InputAdornment>
            ),
            sx: {
              borderRadius: 20,
              height: 42,
            },
          }}
          size="small"
          placeholder="Search for users"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {absolute && (
          <IconButton
            sx={{
              width: 16,
              padding: 0,
              margin: 0,
            }}
            onClick={() => {
              setMenu(false);
            }}
          >
            <MdClose size={27} />
          </IconButton>
        )}
      </div>
      <div className="pl-2 pr-1 py-3" style={{ minHeight: '82vh' }}>
        {filteredChatUsers?.length <= 0 && (
          <div className="h-full mt-20 flex justify-center items-center">
            <p
              className="text-xl px-4 py-1 rounded-full border"
              style={{
                backgroundColor: 'rgba(0,0,0,.02)',
                color: theme?.palette?.primary?.dark,
                fontWeight: 500,
              }}
            >
              <p className="text-xl">No chat found!</p>
            </p>
          </div>
        )}

        {filteredChatUsers?.map((chatUser, index) => {
          return (
            <div key={'user' + index + chatUser?.id}>
              {/* <p
                style={{
                  color: theme.palette.primary.main,
                  fontSize: 16,
                  fontWeight: 500,
                  marginBottom: 10,
                  marginLeft: 8,
                }}
                className="mt-2"
              >
                {chatUser?.plural}
              </p> */}
              {chatUser?.users?.map((user, userIndex) => {
                if (user) {
                  if (user?.id == currentUser?.id) return;
                  return user?.id == selectedChat?.id ? (
                    <div
                      className={`flex gap-3 px-2 py-3 border-bf ${
                        settings?.mode == 'light' ? '' : 'border-gray-700'
                      } hover:cursor-pointer rounded-md`}
                      key={'user' + user?.id}
                      style={{
                        backgroundImage: `linear-gradient(98deg, ${theme.palette.customColors.primaryGradient}, ${theme.palette.primary.main} 94%)`,
                      }}
                    >
                      <Badge
                        overlap="circular"
                        sx={{ ml: 2, cursor: 'pointer' }}
                        badgeContent={
                          <BadgeContentSpan
                            backgroundColor={
                              onlineUsers?.includes(user?.id) ? '#1ea966' : 'red'
                            }
                          />
                        }
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      >
                        {user?.url ? <Avatar src={user?.url} sx={{border: '2px solid white'}} /> : <Avatar sx={{bgcolor: colors[index % colors?.length], fontWeight: 700, fontSize: 15, width: 36, height: 36, border: '2px solid white', color: 'white'}}>{user?.name?.split(' ')?.map(nm=>nm[0])?.join('')?.slice(0, 2)}</Avatar>}

                      </Badge>
                      <div>
                        <p
                          style={{
                            fontSize: 14.5,
                            fontWeight: 500,
                            color: '#f6f1ff',
                          }}
                        >
                          {user?.name}
                        </p>
                        <p
                          style={{
                            fontSize: 13,
                            fontWeight: 400,
                            color: 'rgba(255,255,255,.8)',
                          }}
                        >
                          {onlineUsers?.includes(user?.id) ? 'Online' : 'Offline'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`flex gap-3 px-2 py-3 border-bf ${
                        userIndex == 0 ? 'border-t' : ''
                      } ${
                        settings?.mode == 'light' ? '' : 'border-gray-700'
                      } hover:cursor-pointer hover:${
                        mode == 'light' ? 'bg-gray-100' : 'bg-gray-800'
                      } rounded-md`}
                      key={'user' + user?.id}
                      onClick={() => {
                        setSelectedChat({
                          id: user?.id,
                          name: user?.name,
                          url: user?.url,
                          role: user?.role,
                        });
                      }}
                    >
                      <Badge
                        overlap="circular"
                        sx={{ ml: 2, cursor: 'pointer' }}
                        badgeContent={
                          <BadgeContentSpan
                            backgroundColor={
                              onlineUsers?.includes(user?.id) ? '#1ea966' : 'red'
                            }
                          />
                        }
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      >
                       {user?.url ? <Avatar src={user?.url} sx={{border: '1px solid #2fb9ff'}}/> : <Avatar sx={{bgcolor: colors[index % colors?.length], fontWeight: 700, fontSize: 15, width: 36, height: 36, border: '1px solid #2fb9ff', color: 'white'}}>{user?.name?.split(' ')?.map(nm=>nm[0])?.join('')?.slice(0, 2)}</Avatar>}
                      </Badge>
                      <div>
                        <p
                          style={{
                            fontSize: 14.5,
                            fontWeight: 500,
                            color: mode == 'light' ? '#77747c' : '',
                          }}
                        >
                          {user?.name}
                        </p>
                        <p
                          style={{
                            fontSize: 13,
                            fontWeight: 400,
                            color:
                              mode == 'light' ? '#b4b2b7' : '#716c89',
                          }}
                        >
                          {onlineUsers?.includes(user?.id)
                            ? 'Online'
                            : 'Offline'}
                        </p>
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default ChatList;
