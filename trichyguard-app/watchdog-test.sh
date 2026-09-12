#!/bin/bash
# Bounded test launcher: kills the entire Electron process tree immediately
# if total CPU exceeds a hard limit, or after MAX_SECONDS regardless.
set -u
cd "$(dirname "$0")"

MATCH="trichyguard-app/node_modules/electron"
LOGFILE=/tmp/trichyguard-electron.log
MAX_SECONDS=10
CPU_LIMIT=150

rm -f "$LOGFILE"
nohup ./node_modules/.bin/electron . > "$LOGFILE" 2>&1 < /dev/null &
disown
echo "launched"

kill_all() {
  local pids
  pids=$(ps aux | grep "$MATCH" | grep -v grep | awk '{print $2}')
  if [ -n "$pids" ]; then
    kill -9 $pids 2>/dev/null
  fi
}

for i in $(seq 1 "$MAX_SECONDS"); do
  sleep 1
  pids=$(ps aux | grep "$MATCH" | grep -v grep | awk '{print $2}')
  if [ -z "$pids" ]; then
    echo "t+${i}s: process exited on its own"
    break
  fi
  cpu_sum=$(ps -o %cpu= -p $(echo "$pids" | tr '\n' ',' | sed 's/,$//') 2>/dev/null | awk '{s+=$1} END{print s+0}')
  mem_sum=$(ps -o %mem= -p $(echo "$pids" | tr '\n' ',' | sed 's/,$//') 2>/dev/null | awk '{s+=$1} END{print s+0}')
  echo "t+${i}s cpu=${cpu_sum}% mem=${mem_sum}% procs=$(echo "$pids" | wc -l)"
  over=$(awk -v c="$cpu_sum" -v l="$CPU_LIMIT" 'BEGIN{print (c>l)?1:0}')
  if [ "$over" = "1" ]; then
    echo ">>> CPU LIMIT EXCEEDED (${cpu_sum}% > ${CPU_LIMIT}%) -- killing now"
    kill_all
    echo "killed"
    exit 1
  fi
done

echo "--- reached time limit, killing for cleanup ---"
kill_all
echo "done"
