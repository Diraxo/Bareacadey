import React, { useEffect, useRef, useState } from 'react';
import Room from './Room';

const VideoChat = ({socket}) => {

  return (
    <div>
      <Room socket={socket} />
    </div>
  )
};

export default VideoChat;
