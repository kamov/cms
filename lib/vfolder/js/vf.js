$(document).ready(function() {
	
	$('.vf-slideshow').livequery(function() {
		$(this).vfSlideshow();
	});
	$('.vf-uploader').livequery(function() {
		$(this).vfUploader();
	});
	$('.vf-gallery').livequery(function() {
		$(this).vfGallery();
	});

});

(function($) {

	$.fn.vfSlideshow = function(params) {
		return this.each(function() {
			var slide = vf.slideshow($(this), params);
			slide.init();
		});
	};

	$.fn.vfUploader = function(params) {
		return this.each(function() {
			var up = vf.uploader($(this), params);
			up.init();
		});
	};

	$.fn.vfGallery = function(params) {
		this.each(function() {
			var gallery = vf.gallery($(this), params);
			gallery.init();
		});
	};

}) (jQuery);

var vf = {
	slideshow: function($div, params) {
		if (!$div) return;
		var that = {
			container : $div,
			mainContainer : $('.vf-slideshow-main', $div),
			mainContainerWidth: 0,
			mainImageContainer : $('.vf-slideshow-image', $div),
			captionContainer : $('.vf-slideshow-caption', $div),
			controls : $('.vf-slideshow-controls', $div),
			mainImageContainerWidth : 0,
			numImages : 0,
			thumbContainer : $('.vf-slideshow-thumbs', $div),
			autostart : $div.attr('autostart') ? true : false,
			autohide : ($div.attr('autohide') == 'yes') ? true : false,
			transition : $div.attr('transition'),
			activeClass : 'selected',
			delay : $div.attr('delay')
		};
		return {
			setWidth : function() {
				var w = 0, num = 0;
				$('img', that.mainContainer).each(function(i) {
					w += $(this).width();
					if (i == 0) {
						that.mainContainer.width(w);
						that.mainContainerWidth = w;
						that.mainContainer.height($(this).height());
					}
					if (that.transition == 'fade') {
						$(this).css('position', 'absolute');
					}
					num++;
				});
				that.mainImageContainerWidth = w;
				that.mainImageContainer.width(w);
				that.numImages = num;
				return this;
			},
			init : function() {
				this.setWidth().binders();
				if (that.autostart) this.start();
			},
			binders : function() {
				var ob = this;
				$('.vf-slideshow-thumb', that.thumbContainer).live('click', function() {
					var $this = $(this),
						index = $('.vf-slideshow-thumb', that.thumbContainer).index($this);
					ob.goTo(index);
				});
				$('a', that.controls).click(function(e) {
					e.preventDefault();
					var $this = $(this),
						action = $this.attr('href');
					action = action.split('#')[1];
					switch (action) {
						case 'playpause' : 
							if (that.interval) {
								ob.stop();
								$this.removeClass('vf-slideshow-pause').addClass('vf-slideshow-play');
							} else {
								ob.start();
								$this.removeClass('vf-slideshow-play').addClass('vf-slideshow-pause');
							}
							break;
						case 'prev' : 
							ob.goTo(ob.getPrevSelectedPosition());
							break;
						case 'next' : 
							ob.goTo(ob.getNextSelectedPosition());
							break;
						case 'enlarge' :
							var curr = ob.getCurrentSelectedPosition(),
								ide = $($('.vf-slideshow-thumb', that.thumbContainer)[curr]).attr('ide');
							$.skybox('/ajax/vf/enlarge/' + ide);
							break;
					}
				});
				that.mainImageContainer.css('cursor', 'pointer')
					.click(function(e) {
						e.preventDefault();
						ob.goTo(ob.getNextSelectedPosition());
					});
				if (that.autohide) {
					$.data(that.controls[0], 'realHeight', that.controls.height());
					that.controls.stop().animate({ height: 0, paddingTop: 0, paddingBottom: 0 });
					that.mainContainer.hoverIntent({
						timeout: 100,
						over: function() {
							that.controls.stop().animate({ height : that.controls.data('realHeight'), padding:10 }, 600);
						},
						out: function() {
							that.controls.stop().animate({ height: 0, paddingTop: 0, paddingBottom: 0 }, 600);
						}
					});
				}
			},
			start: function() {
				var ob  = this;
				that.interval = setInterval(function() {
					ob.goTo(ob.getNextSelectedPosition());
				}, that.delay);
			},
			stop: function() {
				clearInterval(that.interval);
				that.interval = null;
				return this;
			},
			getCurrentSelectedPosition : function() {
				var pos = 0;
				$('.vf-slideshow-thumb', that.thumbContainer).each(function(i) {
					if ($(this).hasClass('selected')) pos = i;
				});
				return pos;
			},
			getNextSelectedPosition : function(currentPosition) {
				if (!currentPosition) currentPosition = this.getCurrentSelectedPosition();
				if (currentPosition == that.numImages - 1) return 0;
				return currentPosition + 1;
			},
			getPrevSelectedPosition : function(currentPosition) {
				if (!currentPosition && currentPosition != 0) currentPosition = this.getCurrentSelectedPosition();
				if (currentPosition == 0) return that.numImages - 1;
				return currentPosition - 1;
			},
			goTo : function(position) {
				var $current;
				$('.vf-slideshow-thumb', that.thumbContainer).each(function(i) {
					if (i == position) {
						$current = $(this);
						$(this).addClass('selected');
					} else {
						$(this).removeClass('selected');
					}
				});
				switch (that.transition) {
					case 'fade' : 	this.fadeTo(position); 		break;
					default : 		this.slideTo(position);		break;
				}
				var caption = $current.attr('caption');
				if (!!caption) {
					that.captionContainer.text(caption);
				} else {
					that.captionContainer.text('');
				}
				return this;
			},
			slideTo : function(position) {
				var margin = position * that.mainContainerWidth;
				that.mainImageContainer.stop().animate({ marginLeft:  - margin + 'px'}, 450);
				return this;
			},
			fadeTo : function(position) {
				$('img', that.mainImageContainer).each(function(i) {
					if (i == position) {
						$(this).fadeIn('slow');
					} else {
						$(this).fadeOut('slow');
					}
				});
			}
		};		
	},
	gallery: function($div) {
		if (!$div) return;
		var settings = {
				gallery : $div,
				token : $div.attr('token'),
				identifier : $div.attr('id')
			};
		return {
			init : function() {
				
			},
			reload: function() {
				var that = this;
				$.post('/ajax/vf/gallery', { _token : settings.token }, function(data) {
					settings.gallery.after(data);
					settings.gallery.remove();
					that.init();
				});
			}
		}
	},
	uploader : function($div, params) {
		if (!$div) return;
		var settings = {
				button : $div,
				buttonElement : $div.get(0),
				token : $div.attr('uploader_token'),
				gallery: $div.attr('refresh_gallery')
			};
		return {
			init : function() {
				if (this.uploaderSet()) return;
				settings.button_id = (settings.button.attr('id')) ? settings.button.attr('id') : 'vf_uploader_' + settings.token;
				settings.button.attr('id', settings.button_id);
				settings.uploader = new plupload.Uploader({
					runtimes: 'html5,flash,html4',
					browse_button: settings.button_id,
					url : '/ajax/vf/upload',
					flash_swf_url : '/lib/plupload/js/upload.flash.swf'
				});
				this.bindToUploader();
			},
			uploaderSet : function() {
				for (var i in settings.buttonElement) {
					if (i.match(/Plupload/)) return true;
				}
				return false;
			},
			refreshGallery : function() {
				var $gallery = $('#' + settings.gallery);
				if (!$gallery.length) {
					console.log('gallery not found');
					console.dir(settings);
					return;
				}
				vf.gallery($gallery).reload();
			},
			bindToUploader : function() {
				var d = this,
					events = {
						FilesAdded : function(up, files) {
							var id = 'status_' + settings.button_id,
								do_upload = false;
								display = '<div class="vf-uploader-status-skybox">';
							display += '<div id="' + id + '" class="vf-uploader-status">Uploading...</div>';
							$.each(files, function(i, file) {
								display += '<div id="' + file.id + '" class="vf-uploader-upload-file has-floats"><a href="#" class="vf-uploader-control vf-uploader-remove"></a>' + file.name + '</div>';
								do_upload = true;
							});
							display += '</div>';
							$.skyboxShow(display);
							settings.statusDiv = $('#' + id);
							if (do_upload) settings.uploader.start();
						},
						FilesRemoved : function(up, files) {
							$.each(files, function(i, file) {
								$('#' + file.id).remove();
							});
						},
						FileUploaded : function(up, file, info) {
							var $file = $('#' + file.id + ' .vf-uploader-control');
							aql.json.handle($.parseJSON(info.response), settings.statusDiv, {
								success: function() { 
									$file.removeClass('vf-uploader-loading').addClass('vf-uploader-done')
										.parent().animateChange();
								},
								error2: function() {
									up.stop();
									$('.ui_dialog .close', settings.statusDiv).click(function() {
										$.skyboxHide();
									});
								}
							});
						},
						UploadFile : function(up, files) {
							up.settings.multipart_params = {
								'_token' : settings.token
							};
						},
						UploadProgress : function(up, file) {
							$('#' + file.id + ' .vf-uploader-control').removeClass('vf-uploader-cancel').addClass('vf-uploader-loading');
						},
						UploadComplete : function(up) {
							setTimeout(function() {
								$.skyboxHide();
							}, 1000);
							aql.success(settings.statusDiv, 'Files Uploaded');
							d.refreshGallery();
						}
					};
				settings.uploader.bind('FilesRemoved', events.FilesRemoved);
				settings.uploader.bind('FileUploaded', events.FileUploaded);
				settings.uploader.bind('UploadFile', events.UploadFile);
				settings.uploader.bind('UploadProgress', events.UploadProgress);
				settings.uploader.bind('UploadComplete', events.UploadComplete);
				settings.uploader.init();
				settings.uploader.bind('FilesAdded', events.FilesAdded);
				$('.vf-uploader-remove').die().live('click', function() {
					var id = $(this).closest('.vf-uploader-upload-file').attr('id');
					settings.uploader.removeFile(settings.uploader.getFile(id));
					return false;
				});
			}
		}
	}
};