//  HOLIDAY HELPERS
console.log("Holiday.js Loaded")
async function isHoliday(date){
  try{
    const holidays = await getHolidays();

    return holidays.find(h => h.date === date);

  }catch(err){
    console.error(err);
    return null;
  }
}

// GET HOLIDAYS
async function getHolidays(){

  try {
    const holidays = await DataLayer.getHolidays();
    saveCachedHolidays(holidays);

    return holidays;

  } catch (err) {
    console.warn(
      "Using Cached Holidays"
    );

    return getCachedHolidays();
  }
}

// ADD HOLIDAY
async function createHoliday(holiday){

  const res = await fetch("/api/holidays",{
    method:"POST",
    headers:{
      "Content-Type":"application/json"
    },
    credentials:"include",
    body:JSON.stringify(holiday)
  });

  const result = await res.json();

  if(!res.ok){
    throw new Error, showToast(data.message || "Failed to Create Holiday", "error");
  }

  return result.data;
}

// DELETE HOLIDAY
async function removeHoliday(date){

  const res = await fetch(`/api/holidays/${date}`,{
    method:"DELETE",
    credentials:"include"
  });

  const result = await res.json();

  if(!res.ok){
    throw new Error, showToast(data.message || "Failed to Delete Holiday", "error");
  }

  return result.data;
}

// LOAD HOLIDAYS
async function loadHolidays(){

  try{

    const holidays = await getHolidays();

    renderHolidays(holidays);

  }catch(err){

    showToast(err.message, "error");

  }
}

// RENDER HOLIDAYS
function renderHolidays(holidays){

  const table = document.getElementById("holidaysTable");

  if(!table) return;

  table.innerHTML = "";

  holidays.forEach(holiday => {

    table.innerHTML += `
      <tr>
        <td>${holiday.date}</td>
        <td>${holiday.name}</td>
        <td>
          <button
            class="delete-btn"
            onclick="deleteHoliday('${holiday.date}')"
          >
            Delete
          </button>
        </td>
      </tr>
    `;

  });

}

// ADD HOLIDAY
async function addHoliday(){

  const date = document.getElementById("holidayDate").value;
  const name = document.getElementById("holidayName").value.trim();

  if(!date || !name){
    showToast("Enter Holiday Date and Name", "warning");
    return;
  }

  try{

    await createHoliday({
      date,
      name
    });

    showToast("Holiday Added");

    document.getElementById("holidayDate").value = "";
    document.getElementById("holidayName").value = "";

    loadHolidays();

  }catch(err){

    showToast(err.message, "error");

  }
}

// DELETE HOLIDAY
async function deleteHoliday(date){
  
  const confirm = await showConfirm(`Delete Holiday ${date}?`);
  if(!confirm) return;

  try{

    await removeHoliday(date);

    showToast("Holiday deleted");

    loadHolidays();

  }catch(err){

    showToast(err.message, "error");

  }
}

/* ===========================
   HOLIDAY DATE CHECK
=========================== */

async function checkHolidayWarning(){

  const dateInput =
  document.getElementById("datePicker");

  if(!dateInput) return;

  const holiday =
  await isHoliday(dateInput.value);

  let warning =
  document.getElementById("holidayWarning");

  const submitBtn =
  document.getElementById("saveAttendanceBtn");

  if(!warning){

    warning = document.createElement("div");

    warning.id = "holidayWarning";

    warning.style.marginTop = "10px";
    warning.style.padding = "10px";
    warning.style.borderRadius = "8px";
    warning.style.fontWeight = "bold";

    dateInput.parentNode.appendChild(warning);
  }

  if(holiday){

    warning.style.background = "#fff3cd";
    warning.style.color = "#856404";

    if(submitBtn){
  submitBtn.disabled = true;
}

    warning.innerHTML =
      `📅 Holiday: ${holiday.name}`;

  }else{

 if(submitBtn){
      submitBtn.disabled = false;
    }
    
    warning.innerHTML = "";
    warning.style.background = "transparent";

   
  }
}

