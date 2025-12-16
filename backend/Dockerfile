FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /app

COPY *.csproj ./
RUN dotnet restore

COPY . ./
RUN dotnet publish -c Release -o out

FROM mcr.microsoft.com/dotnet/aspnet:10.0
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.7.0 /lambda-adapter /opt/extensions/lambda-adapter
WORKDIR /app
COPY --from=build /app/out .
EXPOSE 8080
ENV PORT=8080
ENTRYPOINT ["dotnet", "NorthStar.API.dll"]
