package log

import (
	"fmt"
	"log"
	"os"
)

// to keep dependencies small, fancy logger are not used
// only info and debug level are supported
// only info
/*
	- Debug(v)
	- Debugf(f,v...)
	- Info(v)
	- Infof(f,v...)
	- Error(v)
	- Errorf(f,v...)
*/
var l customLogger

const (
	debugMessage string = " [ DEBUG ] "
	infoMessage  string = " [ INFO ] "
	errorMessage string = " [ERROR] "
	callDepth    int    = 2
)

type customLogger struct {
	isDebug bool
	infoL   *log.Logger
	debugL  *log.Logger
	errorL  *log.Logger
}

func InitLogger(isDebug bool) {
	l = customLogger{
		isDebug: isDebug,
		infoL:   log.New(os.Stdout, infoMessage, log.Ldate|log.Ltime|log.Lshortfile|log.Lmsgprefix),
		debugL:  log.New(os.Stdout, debugMessage, log.Ldate|log.Ltime|log.Lshortfile|log.Lmsgprefix),
		errorL:  log.New(os.Stdout, errorMessage, log.Ldate|log.Ltime|log.Lshortfile|log.Lmsgprefix),
	}
}

func Debug(v ...interface{}) {
	if !l.isDebug {
		return
	}
	_ = l.debugL.Output(callDepth, fmt.Sprint(v...))
}

func Debugf(f string, v ...interface{}) {
	if !l.isDebug {
		return
	}
	_ = l.debugL.Output(callDepth, fmt.Sprintf(f, v...))
}

func Info(v ...interface{}) {
	_ = l.infoL.Output(callDepth, fmt.Sprint(v...))
}

func Infof(f string, v ...interface{}) {
	_ = l.infoL.Output(callDepth, fmt.Sprintf(f, v...))
}

func Error(v ...interface{}) {
	_ = l.errorL.Output(callDepth, fmt.Sprint(v...))
}

func Errorf(f string, v ...interface{}) {
	_ = l.errorL.Output(callDepth, fmt.Sprintf(f, v...))
}
