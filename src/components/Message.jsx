import React from 'react'
import {auth} from '../firebase'
import {key} from './LogOut';

const style = {
  message: `flex items-center shadow-xl m-4 py-2 px-3 rounded-tl-full rounded-tr-full`,
  name: `absolute mt-[-4rem] text-gray-600 text-xs`,
  sent: `bg-[#395dff] text-white flex-row-reverse text-end float-right rounded-bl-full`,
  received: `bg-[#e5e5ea] text-black float-left rounded-br-full`,
};

const Message = ({ message }) => {
  const messageClass = 
  message.uid === auth.currentUser.uid
  ? `${style.sent}`
  : `${style.received}`
  const CryptoJS = require('crypto-js');
  console.log(key)
  
  
  var decryptedValue = CryptoJS.AES.decrypt(message.text.toString(CryptoJS.enc.Base64), key, { padding: CryptoJS.pad.Pkcs7 });
  // var decryptedString = decryptedValue.toString(CryptoJS.enc.Utf8);
  // var decryptedString = decryptedValue.toString(CryptoJS.enc.Utf8);
  var decryptedString = decryptedValue.toString(CryptoJS.enc.Utf8);

  return (
    <div>
      <div className={`${style.message} ${messageClass}`}>
        <p className={style.name}>{message.name}</p>
        <p>{decryptedString}</p>
      </div>
    </div>
  );
};

export default Message;