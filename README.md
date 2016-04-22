# schoolbag_queue
Django application to runs schoolbag tasks

## SERVER
  * **Domain**
  
    schoolbag-queue.cloudapp.net
    
  * **SSH**
  
    ssh azureuser@schoolbag-queue.cloudapp.net
    
    
## APP
  * **Directory**
    
    `/home/azureuser/apps/schoolbag_queue`
  * **Activating environment**
  
    `source /home/azureuser/.envs/queue/bin/activate`
    
  * **Starting celery**
  
    celery -A schoolbag_queue worker -l info
    
  * **Starting django server in development**
  
    ./manage.py runserver

  * **Starting foreman and django together**
    
    After Activate the environment run:
    `foreman start`
  
