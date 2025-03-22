# Az2OpenAI
使Azure AI接口适配Openai的接口，使用Azure函数

接口地址`https:/<sitename>.azurewebsites.net/api/v1/chat/completions`

## 如何使用？
先决条件：拥有Azure订阅
1. 新建一个函数应用
   
   ![image](https://github.com/user-attachments/assets/c9a4e10b-7376-4c57-aa31-0f30a4de9736)
       
    | 参数          | 推荐       |
    |---------------|------------|
    | 运行时堆栈    | Node.js    |
    | 版本          | 20 LTS     |
    | 操作系统      | Linux      |

2. 部署完成后，在**部署中心**填入本仓库
3. 如果部署失败，可以尝试添加环境变量`WEBSITE_RUN_FROM_PACKAGE = 1`，参考[stackoverflow](https://stackoverflow.com/questions/78900830/deploying-azure-function-with-github-actions-fails-without-providing-clear-reaso)
