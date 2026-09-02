const api = async (path, options={}) => {
  const r = await fetch(path,{headers:{"Content-Type":"application/json"},...options});
  const data=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(data.message||"Request failed");
  return data;
};

document.querySelector("#loginForm").addEventListener("submit",async e=>{
  e.preventDefault();
  const err=document.querySelector("#loginError");err.textContent="";
  try{
    const data=await api("/api/auth/login",{method:"POST",body:JSON.stringify({
      email:email.value,password:password.value
    })});
    localStorage.setItem("pua_token",data.token);
    location.href=data.user.role==="ADMIN"?"/admin.html":"/doctor.html";
  }catch(ex){err.textContent=ex.message}
});

document.querySelector("#registerForm").addEventListener("submit",async e=>{
  e.preventDefault();
  const msg=document.querySelector("#registerMsg");msg.textContent="";
  try{
    await api("/api/auth/register",{method:"POST",body:JSON.stringify({
      name:rName.value,email:rEmail.value,password:rPassword.value,title:rTitle.value,
      phone:rPhone.value,building:rBuilding.value,office:rOffice.value
    })});
    msg.textContent="Account created. Wait for admin approval, then log in.";
    e.target.reset();
  }catch(ex){msg.textContent=ex.message}
});