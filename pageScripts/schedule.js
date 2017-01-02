/*      schedule.js

				THIS IS THE PAGESCRIPT FOR THE SCHEDULE PAGE
				*/

//Set the current page variable
curPage = "schedule";
var homeworkList = ["lektie"];

//On the download links in class notes, set the title attribute to the file name, so we can see the full filename on hover.
function setTitleToDownload() {
	$("a[download]").each(function() {
		$(this).attr("title", $(this).attr("download"));
	});
}
setInterval(setTitleToDownload, 250);

//Function to be called every time settings are changed
function loadScheduleSettings() {

	//Keywords for checking homework
	getStorage({homeworkWords: "lektie,forbered"}, function(obj) {
		if (!chrome.runtime.error) {
			homeworkList = stringToList(obj.homeworkWords);
		}
	});

	//Get the homework setting
	var homeworkCheckerInterval;
	getStorage('homework', function (obj) {
		if (!chrome.runtime.error) {
			//If the schedule object exists and the homework setting is true, setup interval to mark
			if (window.location.href.indexOf("skema")) {
				if(obj.homework){
					//Interval to mark homework, they will be marked when they load in
					clearInterval(homeworkCheckerInterval);
					homeworkCheckerInterval = setInterval(function() {
						markHomework();
					}, 250);
				}
			}
		}
	});


	getStorage({toHide: ""}, function(obj) {
		if (!chrome.runtime.error) {
			toHideList = stringToList(obj.toHide);
			$(".hiddenLesson").removeClass("hiddenLesson");
			setInterval(function() {
				for (var i=0; i < toHideList.length; i++) {
					$(".DagMedBrikker").find("g").find("text:contains('" + toHideList[i] + "')").parent().parent().addClass("hiddenLesson");
				}
			}, 250);
		}
	});


}

loadScheduleSettings();
chrome.storage.onChanged.addListener(function(changes, namespace) {
	//Try to import the theme from the settings storage
	loadScheduleSettings();
});

// <---- HOMEWORK MARKING
//Function for marking the homework
function markHomework(){
	$(".homeworkLesson").removeClass("homeworkLesson");
	$('.skemaBrikGruppe>g>g>text>title').each(function(index) {
		var toMark = false;
		var arrayLength = homeworkList.length;
		for (var i=0; i < arrayLength; i++) {
			if ($(this).text().toUpperCase().includes(homeworkList[i].toUpperCase())) toMark = true;
		}
		if (toMark) {
			$(this).parent().parent().parent().find('rect').each(function () { $(this).addClass("homeworkLesson"); });
		}
	});
}


//We'll save the schedule HTML so we can serve it to the user when UDDATA is down.
function cacheSchedule() {
	//Generates day in ISO format. This is the format they use in their URLs
	var today = new Date();
	var isoDate = today.getDate() + "-" + (today.getMonth()+1) + "-" + (today.getYear()+1900);
	var isoDate = (today.getYear()+1900) + "-" + (today.getMonth()+1) + "-" + today.getDate();
	//Creates a regular expression that matches an URL that ends with either the ISO date, id_skema#, or id_skema.
	var checkDate = new RegExp("(" + isoDate + "|id_skema#|id_skema)" + '$');
	if (window.location.href.match(checkDate)) {
		//Gets the schedule object
		var scheduleHTML = $($.parseHTML($("svg")[0].outerHTML));

		//Removes the menu buttons, as you can't interact with the schedule anyway
		scheduleHTML.find(".actionMenu").remove();
		//Removes this thing I don't remember what is, but it definitely isn't needed, and storage is expensive
		scheduleHTML.find(".skemaLinieGruppe").parent().remove();
		//Removes the red line, as we don't have the code to move it anymore
		scheduleHTML.find("line").remove();
		//Removes empty skemaBrikGruppe's
		scheduleHTML.find(".skemaBrikGruppe:empty").remove();
		//Removes empty DagMedBrikker's (Makes a lot of sense if the weekends are empty, as they are most of the time, thank God)
		scheduleHTML.find(".DagMedBrikker:empty").remove();


		//Usually, the classes are a third of the way down the schedule, but we don't want that. So first, we find the class with the lowest height
		var minHeight = 10000;
		scheduleHTML.find(".skemaBrikGruppe > g").each(function() {
			var height = $(this)[0].transform.baseVal[0].matrix.f;
			if (height < minHeight) minHeight = height;
		});

		//And then we move all the classes up by the smallest height, moving the first classes to 0.
		scheduleHTML.find(".skemaBrikGruppe > g").each(function() {
			$(this)[0].transform.baseVal[0].matrix.f = $(this)[0].transform.baseVal[0].matrix.f - minHeight;
		});

		//Convert the scheduleHTML object into a string, and save it
		scheduleHTML = scheduleHTML[0].outerHTML;
		setStorage({"cachedSchedule": scheduleHTML }, true);
	}
}

window.setTimeout(cacheSchedule, 5000);

$(document.body).append("<style>.hideLesson { visibility: hidden; }</style>");