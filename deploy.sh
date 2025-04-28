TODAY="$(date +'%d%m%Y-%H:%M')"

echo ===================================================
echo Autodeploy server
echo $TODAY
echo ===================================================
echo Connecting to remote server...
output=$(ssh bbpc 'bash -i'  << ENDSSH
    #Connected
    #Go to client directory
    echo "$TODAY"
    exit
ENDSSH
)
echo "$output"
echo Syncing new files to server
rsync -avz --progress ./dist/ bbpc:~/apps/crownboulevard/
# scp -r ./dist/ bbpc:~/apps/crownboulevard/