function goBack(){
window.location.href="attendance.html";
}

async function renderPerformance(){

const students = await getStudents();
const attendance = await getAttendance();
	
	if(!Array.isArray(students) || !Array.isArray(attendance)){
console.error("Invalid data", students, attendance);
return;
}

let stats = {};

students.forEach(s=>{
stats[s.name]={ontime:0,late:0,absent:0};
});

attendance.forEach(day=>{

(day.records || []).forEach(r=>{

if(stats[r.student]){
stats[r.student][r.status]++;
}

});

});

let html=`
<table>
<tr>
<th>Student</th>
<th>On Time</th>
<th>Late</th>
<th>Absent</th>
<th>Attendance %</th>
</tr>
`;

Object.entries(stats).forEach(([name,data])=>{

let total=data.ontime+data.late+data.absent;

let percent=total?Math.round((data.ontime+data.late)/total*100):0;

html+=`
<tr>
<td>${name}</td>
<td>${data.ontime}</td>
<td>${data.late}</td>
<td>${data.absent}</td>
<td>${percent}%</td>
</tr>
`;

});

html+="</table>";

document.getElementById("performanceTable").innerHTML=html;

}

document.addEventListener("DOMContentLoaded", renderPerformance);

	async function checkAlerts(){

const attendance=await getAttendance();
		
		if(!Array.isArray(attendance)){
console.error("Invalid attendance data:", attendance);
return;
}

let lateCount={};
let absenceStreak={};

attendance.forEach(day=>{

day.records.forEach(r=>{

if(!lateCount[r.student]){
lateCount[r.student]=0;
}

if(!absenceStreak[r.student]){
absenceStreak[r.student]=0;
}

if(r.status==="late"){
lateCount[r.student]++;
}

if(r.status==="absent"){
absenceStreak[r.student]++;
}else{
absenceStreak[r.student]=0;
}

});

});

let alerts="";

Object.keys(lateCount).forEach(name=>{

if(lateCount[name]>=5){
alerts+=`⚠️ ${name} has been late ${lateCount[name]} times<br>`;
}

});

Object.keys(absenceStreak).forEach(name=>{

if(absenceStreak[name]>=3){
alerts+=`⚠️ ${name} absent for ${absenceStreak[name]} consecutive days<br>`;
}

});

if(alerts){
document.getElementById("performanceTable").innerHTML=
`<div style="color:red;font-weight:bold">${alerts}</div>`+
document.getElementById("performanceTable").innerHTML;
}

}

document.addEventListener("DOMContentLoaded", checkAlerts);
