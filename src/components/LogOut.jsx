import React from 'react'
import { auth } from '../firebase'

var key = "No key entered"
const style = {
  button: "bg-gray-200 px-4 py-2 hover:bg-gray-100",
  button2: "bg-gray-200 px-4 py-2 hover:bg-gray-100 ml-8"
}
const LogOut = () => {
  // key = prompt("Enter key")
  const signOut = () => {
    signOut(auth);
  }

  const handleKeyPrompt = () => {
    key = prompt("Enter key");
  };
  return (
    <div>
      <button onClick={() => auth.signOut()} className={style.button}>LogOut</button>
      <button onClick={handleKeyPrompt} className={style.button2}>Set Key</button>
    </div>
  )
}

export {key};
export default LogOut;