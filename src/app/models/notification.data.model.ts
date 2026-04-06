export interface NotificationDataModel {
    id:number,
    title:string,
    description:string,
    action?:string,
    status:NotificationStatus
    date_of_notification:Date,
}
enum NotificationStatus {
  new = 1,
  delivered = 2,
  read = 3
}