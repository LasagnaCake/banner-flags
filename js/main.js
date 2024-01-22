"use strict";

function getInput(name) {
	return document.getElementById(`${name}-in`)
}

let customSource = "";

const input = {
	"flag":			() => getInput("banner-flag"),
	"customFlag":	() => getInput("custom-flag"),
	"message":		() => getInput("message"),
	"whitespaces":	() => getInput("whitespace"),
	"scrollSpeed":	() => getInput("scroll-speed"),
	"font":			() => getInput("font"),
};

const display = () => document.getElementById("target-svg");

const targetSVG = () => {
	return display().firstChild;
}

const marquee = (i, o = () => {}) => {
	o(targetSVG().getElementsByClassName("scrollable-text")[0].innerHTML);
	Array.from(targetSVG().getElementsByClassName("scrollable-text")).forEach(e => e.innerHTML = i);
}

function assertFlag(onload = false) {
	console.log(input.flag().value);
	if (input.flag().value == "") {
		if (!onload) {
			alert("Please select a flag!");
			if (lastFlag !== "") {
				loadFlag(lastFlag);
				input.flag().value = lastFlag;
			}
		}
		return false;
	}
	return true;
}

function loadFileFromServer(filePath) {
	var result = null;
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open("GET", filePath, false);
	xmlhttp.send();
	if (xmlhttp.status == 200) {
		result = xmlhttp.responseText;
	}
	return result;
}

let lastFlag = "";

function setCustomFlag(input, onload) {
	var r = new FileReader();
	r.addEventListener('load', (e) => {
		sessionStorage.setItem("custom-flag", e.target.result);
		customSource = e.target.result;
		updateFlag();
	});
	r.readAsText(input.files[0]);
}

function loadFlag(path) {
	if (path === "@custom") {
		customSource = sessionStorage.getItem("custom-flag");
		if (customSource !== "" && customSource !== null)
			display().innerHTML = customSource;
		else {
			input.customFlag().click();
			display().innerHTML = customSource;
		}
	} else {
		display().innerHTML = loadFileFromServer(path);
	}
}

function setFlag() {
	const flag = input.flag().value;
	loadFlag(flag);
	lastFlag = flag;
}

function repeatText(text, count) {
	let res = "";
	for (let i = 0; i < count; i++) res += text;
	return res;
}

function getValueOrZero(str, method = parseFloat) {
	const v = method(str);
	return !isNaN(v) ? v : 0;
}

function getScrollSpeed() {
	const ss = getValueOrZero(input.scrollSpeed().value);
	return ss !== 0 ? 1 / ss : 0;
}

function getWhitespaceCount() {
	const wc = getValueOrZero(input.whitespaces().value, parseInt);
	return Math.max(wc, 0);
}

function getBannerCharCount() {
	return input.message().value.length;
}

function getMessageRepeatCount() {
	const v = Math.sqrt((getBannerCharCount() + getWhitespaceCount()) / Math.max(5-getWhitespaceCount(),1));
	return Math.round(100 / (v != 0 ? v : 50));
}

function getBannerMessage() {
	return repeatText(
		input.message().value + repeatText(" ", getWhitespaceCount()),
		getMessageRepeatCount()
	);
}

function updateFlag(onload = false) {
	if (!assertFlag(onload)) return;
	setFlag();
	marquee(getBannerMessage());
	const wc = getWhitespaceCount();
	const cc = getBannerCharCount();
	targetSVG().style.setProperty("--anim-speed", `${getScrollSpeed() * (wc + cc)}s`);
	targetSVG().style.setProperty("--character-count", cc);
	targetSVG().style.setProperty("--whitespace-count", wc);
	targetSVG().style.setProperty("--scroll-size", "calc((var(--character-count) + var(--whitespace-count)) * -1ch)");
	targetSVG().style.fontFamily = `\'${input.font().value}\', monospace`;
}

function saveFile(data, filename, type) {
	let file = new Blob([data], {type: type});
	let
		a = document.createElement("a"),
		url = URL.createObjectURL(file)
	;
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	setTimeout(function() {
		document.body.removeChild(a);
		window.URL.revokeObjectURL(url);  
	}, 0);
}

function generateSVG() {
	if (!assertFlag()) return;
	updateFlag();
	saveFile(display().innerHTML.replace(/&quot;/g, "'"), "banner.svg", "svg");
}

function getMessageFromBanner() {
	let text = "";
	marquee("", (v) => text = v);
	const message = text.split("   ")[0].replace(/\t/g, "");
	return message;
}

function setDefaultsForFlag() {
	if (!assertFlag()) return;
	setFlag();
	input.message().value = getMessageFromBanner();
	input.whitespaces().value = targetSVG().style.getPropertyValue("--whitespace-count");
	input.font().value = targetSVG().style.getPropertyValue("font-family").split(",")[0].replace(/('|\")/g,"");
	const as = getValueOrZero(targetSVG().style.getPropertyValue("--anim-speed").split("s")[0]);
	const wc = getWhitespaceCount();
	const cc = getBannerCharCount();
	input.scrollSpeed().value = (wc + cc) / as;
	updateFlag();
}

function preventNullOrZero(e) {
	e.value = e.value !== "" ? e.value : 0;
	e.value = Math.max(e.value, 0);
}

function downloadSVG() {
	if (!assertFlag()) return;
	if (input.flag().value == "@custom")
		saveFile(customSource, "custom_flag.svg", "svg");
	else
		saveFile(loadFileFromServer(input.flag().value), input.flag().value, "svg");
}

window.addEventListener("load", () => updateFlag(true));