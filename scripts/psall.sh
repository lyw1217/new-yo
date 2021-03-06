#!/bin/bash

CMD="NEWYO"

# COLOR SET #
NORMAL="\033[0;0m"
WHITE="\033[1;1m"
RED="\033[1;31m"
BLUE="\033[1;37;44m"
YELLOW="\033[1;33m"
GREEN="\033[1;32m"
LIGHT_GRAY="\033[1;1;30m"
LIGHT_RED="\033[1;7;31m"
LIGHT_BLUE="\033[1;34m"
LIGHT_CYAN="\033[1;36m"
LIGHT_GREEN="\033[1;7;32m"

# sudo check
#if [ $(id -u) -ne 0 ]; then exec sudo bash "$0" "$@"; exit; fi

print_status()
{
	# PID
	PROC_PID=$(pgrep -f ${CMD})

	echo ""
	echo -e " [$LIGHT_BLUE NEW-YO$NORMAL STATUS ] written by$LIGHT_CYAN YWLEE$NORMAL"

	if [ -z "$PROC_PID" ]; then
		echo -e " > Current Status : $RED[ DOWN ]$NORMAL"
		echo ""
	else
		# PROC_CMD
		PROC_CMD=$(ps -eo args | grep ${CMD} | grep -v grep | grep -v more | grep -v rm | grep -v cat | grep -v vi | grep -v vim | grep -v tail | grep -v awk)

		# UPTIME
		STARTTIME=$(awk '{print int($22 / 100)}' /proc/$PROC_PID/stat)
		UPTIME=$(awk '{print int($1)}' /proc/uptime)
		NOW=$(date +%s)
		DIFF=$((NOW - (UPTIME - STARTTIME)))
		PROC_STIME=`date '+%Y/%m/%d %H:%M:%S' -d @$DIFF`
		echo ""
		echo -e " > Current Status : $GREEN[ UP ]$NORMAL"
		echo    " > PID            : $(pgrep -f ${CMD})"
		echo    " > Start Time     : $PROC_STIME"
		echo    " > CMD            : $PROC_CMD"
		echo ""
	fi
	echo ""
}

print_status
exit 0
