# opnionprobo

![Arc](https://github.com/vanshpatelx/opnionprobo/blob/main/arc.png)


How to divide multiple queues and exchanges, channels ?
1. OrderExchange
    1. placeOrder -> multiple publisher CORE, single subscriber Exchnage LB(scale up)
    2. orderConfirm -> Exchange -> DBServer
2. EventExchange
    1. addEvent -> multiple publisher CORE, single subscriber DB Server (persistance)
    2. addCategory -> multiple publisher CORE, single subscriber DB Server (persistance)
    3. mapping -> multiple publisher CORE, single subscriber DB Server (persistance)
3. UserExchange
    1. addingUser -> multiple publisher CORE, single subscriber DB Server (persistance)
    2. updateUser -> multiple publisher CORE, single subscriber DB Server (persistance)
    3. userCache -> balance and portfolio updates from DBserver to CORE for caching change


placeOrder
have multiple core send to LB of exchange (single) -> divide into exchanges



We don't change anything related to balance and locks in main server, we just use for getting related data from cache, we have single cache for balance and portoflio for exchange and MainServer
everything change by exchange only.

Event Done, we have lots of orders, just have to change status, so Send to Db server

Note : add maintains where we cache everything, also in settlements too


caching
1. cache 1 (main server)
    - username${username} -> Updates -> max time of updates (maintains)
    - order${userId,eventId,id} =>
        1. order${userId} => all order of user (maintains)
        2. order${userId,eventId} => all order of user with specific events
        3. order${userId,eventId,id} => specific order
    - orderRecent${userId} : {eventId, orderId} => sorted orders => just maintain top 25 orders only => faster access
    - category${id} -> maintains
    - events${id}
    - live${category, events}
        - live${category}

2. cache 2 (main server & Exchange)
    - username${username} - balance, portoflio -> not avalible, maintains



userDetails => username${userId}
all orders of User => order${userId}
all recent order of user => orderRecent${userId} : {eventId, orderId}
all orders of specific events of user => order${userId,eventId}
specific order => order${userId,eventId,id}

each category details: category${id} => with req, when start or crached
live category: live${category} =>  all events 
specific event of category : live${category, events}
specific event : events${id}




user register
-> add to cache1 : username${userId}
-> send to Dbserver for add in DB 

user update
-> add to cache1 : username${userId}
-> send to Dbserver for add in DB 

orderPlace
1. add orderInCache : order${userId,eventId,id}, orderRecent${userId}, addToEvent
2. send to Dbserver for add in Db
3. send to exchange

confirmOrder
1. update cache in 2 (balance)
2. send to Dbserver for add in Db
3. send to CORE, change in cache


balance add
1. send to exchange
2. send to Dbserver for add in Db