function make_overlay_div(num, type, day, hour, duration, comment, id) {
	var div = document.createElement('div');
	var cal_width = $("#calendar-outer-box").width();
	var cal_height = $("#calendar-outer-box").height();
	var box_left = Math.max(day*35 + 35 + 2, (cal_width-36)/7*day + 35+2);
	var box_top = 59 + 30 + 40 + (hour-8) * 0.0625 * cal_height + 1;
	var box_height = Math.max(0.0625*cal_height*duration-4 +1, 25*duration-4 +1);
	var box_width = Math.max((cal_width - 35)/7 - 10, 100);

	div.id = "overlay-"+num;
	if (type == "g") {
		div.classList.add('overlay-green');
	}
	else{
		div.classList.add('overlay-red');
	}

	comment += '<form id="overlay-form-' + num + '" action="/preferences/delete/' + id + '" method = "POST" ' + 'class="row row-padding overlay-row overlay-' + type + '" style="position:absolute; bottom:0;width:' + box_width +'px;"><div class="col zero-padding event-button-' + type + ' overlay-right-' + type+'" id="expand-' + num + '">EXPAND</div> <div class="col zero-padding event-button-' + type + '" id="delete-' + num + '">DELETE</div></form>';
	div.style.position = 'absolute';
	div.style.top = box_top + "px";
	div.style.left = box_left + "px";
	div.style.height = box_height + "px";
	div.classList.add('overlay-div');
	div.classList.add('col');
	div.classList.add('text-center');
	div.innerHTML = comment;
	document.body.appendChild(div);
	$($('.overlay-comment')[num]).css('max-height',box_height-30 + "px")
	$(".overlay-box").fadeTo("slow",1);
}

function make_overlay_div_admin(num, type, day, hour, duration, comment, id) {
	var div = document.createElement('div');
	var cal_width = $("#calendar-outer-box").width();
	var cal_height = $("#calendar-outer-box").height();
	var sidebar_width = $(window).width()/6;
	var box_left = Math.max(day*35 + 35 + 2 + sidebar_width, (cal_width-36)/7*day + 35+2 + sidebar_width);
	var box_top = 100 + 59 + 30 + 40 + (hour-8) * 0.0625 * cal_height + 1;
	var box_height = Math.max(0.0625*cal_height*duration-4 +1, 25*duration-4 +1);
	var box_width = Math.max((cal_width - sidebar_width - 35)/7 - 10, 100);

	div.id = "overlay-"+num;
	if (type == "g") {
		div.classList.add('overlay-green');
	}
	else{
		div.classList.add('overlay-red');
	}

	comment += '<form id="overlay-form-' + num + '" action="/preferences/delete/' + id + '" method = "POST" ' + 'class="row row-padding overlay-row overlay-' + type + '" style="position:absolute; bottom:0;width:100%;"><div class="col zero-padding event-button-' + type + ' overlay-right-' + type+'" id="expand-' + num + '">EXPAND</div> <div class="col zero-padding event-button-' + type + '" id="delete-' + num + '">DELETE</div></form>';
	div.style.position = 'absolute';
	div.style.top = box_top + "px";
	div.style.left = box_left + "px";
	div.style.height = box_height + "px";
	div.classList.add('overlay-div-admin');
	div.classList.add('col');
	div.classList.add('text-center');
	div.innerHTML = comment;
	document.body.appendChild(div);
	$($('.overlay-comment')[num]).css('max-height',box_height-30 + "px")
	$(".overlay-box").fadeTo("slow",1);
}


function draw_styles(data) {
	var cal_width = $("#calendar-outer-box").width();
	var cal_height = $("#calendar-outer-box").height();
	var box_width = Math.max((cal_width - 36)/7 - 10, 100);

	for(i=0;i<data.length;i++){
		var box_left = Math.max(data[i][1]*35 + 35 + 2 , (cal_width-36)/7*data[i][1] + 35+2);
		if($("#overlay-"+i).length) {
			document.getElementById("overlay-"+i).style.left = box_left + "px";
			$($('.overlay-row')[i]).css('width',box_width)
		}

	}
}

function expand_div(hour,comment){
	var div = document.createElement('div');
	div.classList.add('expanded-div');
	div.classList.add('text-center');
	div.id = "expanded-comment";
	div.innerHTML = "<p><b>" + hour + "</b></p>\"" + comment+ "\"";
	document.body.appendChild(div);
	$("#expanded-comment").fadeTo("fast",1);
}

function fade_neuron(){
	$(".neuron-image").fadeTo(2000,1);
}

function fade_login_row(){
	var fade_time = 500;
	console.log($('.login-row').length);
	$($('.login-row')[0]).fadeTo(fade_time,1, function(){
		if ($('.login-row').length > 1){
			$($('.login-row')[1]).fadeTo(fade_time,1, function(){
				if ($('.login-row').length > 2){
					$($('.login-row')[2]).fadeTo(fade_time,1)
				};
			})
		};
	});
}



