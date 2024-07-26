const express=require("express")
const client=require("prom-client")
const {doSomeHeavyTask} = require("./utill")
const responseTime=require("response-time")

const app=express()
const PORT=process.env.PORT || 8000

const collectionDefaultMetrics=client.collectDefaultMetrics;

collectionDefaultMetrics({register:client.register})

app.get("/",(req,res)=>{
    return res.status(200).send("Hii prometheus")
})
app.get("/slow", async(req,res)=>{
    try{
        const timeTaken=await doSomeHeavyTask();
        return res.json({
            status:"Success",
            message:`Heavy Task Completed in ${timeTaken}ms`,
        })
    }catch(error){
        return res.status(500).json({status:"Error",error:"Internal Srever Error"})
    }
})

const reqrestTime=new client.Histogram({
    name:"http_express_req_res_time",
    help:"This tells how much time is taken by req and res",
    labelNames:["method","route","status_code"],
    buckets:[1,50,100,200,400,500,800,1000,2000]
})
app.use(responseTime((req,res,time)=>{
    reqrestTime.labels({
        method:req.method,
        route:req.url,
        status_code:res.statusCode,
    })
    .observe(time)
}))

app.get("/metrics",async(req,res)=>{
    res.setHeader("Content-Type",client.register.contentType);
    const metrics=await client.register.metrics()
    res.send(metrics)
})
app.listen(PORT,()=>{
    console.log(`Server is listening on port number ${PORT}`);
})