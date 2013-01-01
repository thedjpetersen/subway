#******************************************
#*
#* Simple Makefile for Subway
#*
#*/

COPY = /bin/cp -rp
INSTALL = /usr/bin/install -c -m 644
INSTALL_DIR = assets lib views node_modules

etc_prefix = $(DESTDIR)/etc
lib_prefix = $(DESTDIR)/var/lib
bin_prefix = $(DESTDIR)/usr/bin
log_prefix = $(DESTDIR)/var/log

all:	build

build:
	@npm install

clean:
	${RM} -rf node_modules
	${RM} npm-debug.log

install:	
	mkdir -p $(lib_prefix)/subway
	@for i in $(INSTALL_DIR); do \
	    echo "install libs ==> $$i";\
	    $(COPY) $$i $(lib_prefix)/subway;\
	done
	$(COPY) config.js $(lib_prefix)/subway
	echo "Deploying Subway"
	mkdir -p $(bin_prefix)
	$(INSTALL) subway $(bin_prefix)
	chown root.root $(bin_prefix)/subway
	sed -i "s#\./#$(lib_prefix)/subway/#" $(bin_prefix)/subway
	mkdir -p $(log_prefix)/subway
	touch $(log_prefix)/subway/subway.log
	mkdir -p $(etc_prefix)/subway
	ln -s $(lib_prefix)/subway/config.js $(etc_prefix)/subway/config.js
	chown -R irc.irc $(lib_prefix)/subway $(log_prefix)/subway

uninstall:
	rm -rf /var/lib/subway
	rm -rf /etc/subway
	rm -rf /var/log/subway 		
	rm /usr/bin/subway
