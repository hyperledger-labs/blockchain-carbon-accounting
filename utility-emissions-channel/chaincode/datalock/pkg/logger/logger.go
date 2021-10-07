package logger

import (
	"datalock/pkg/errors"
	"strings"

	"github.com/sirupsen/logrus"
)

var lg *logger

type Interface interface {
	Debugf(format string, args ...interface{})
	Infof(format string, args ...interface{})
	Warnf(format string, args ...interface{})
	Errorf(format string, args ...interface{})
}

type Level string

type logger struct {
	l *logrus.Logger
}

func NewAppLogger(level string) {
	var l logrus.Level
	switch strings.ToLower(level) {
	case "error":
		l = logrus.ErrorLevel
	case "warn":
		l = logrus.WarnLevel
	case "info":
		l = logrus.InfoLevel
	case "debug":
		l = logrus.DebugLevel
	default:
		l = logrus.InfoLevel
	}
	log := logrus.New()
	log.SetLevel(l)
	format := logrus.JSONFormatter{
		DisableTimestamp: true,
	}
	log.SetFormatter(&format)
	log.SetReportCaller(false)
	lg = &logger{log}
}

func Debugf(format string, args ...interface{}) {
	lg.debugf(format, args...)
}

func Infof(format string, args ...interface{}) {
	lg.infof(format, args...)
}

func Warnf(format string, args ...interface{}) {
	lg.warnf(format, args...)
}

func Errorf(format string, args ...interface{}) {
	lg.errorf(format, args...)
}

func (l *logger) debugf(format string, args ...interface{}) {
	l.l.Debugf(format, args...)
}

func (l *logger) infof(format string, args ...interface{}) {
	l.l.Infof(format, args...)
}

func (l *logger) warnf(format string, args ...interface{}) {
	l.l.Warnf(format, args...)
}

func (l *logger) errorf(format string, args ...interface{}) {
	l.l.Errorf(format, args...)
}

func SystemErr(method string, err error) {
	_, ok := err.(*errors.Error)
	if !ok {
		lg.l.Error(err)

		return
	}
	fields := map[string]interface{}{
		"operations": errors.Ops(err),
		"code":       errors.ErrCode(err),
		"method":     method,
	}
	if cc := errors.CC(err); cc != "" {
		fields["chiancode"] = cc
	}
	if txID := errors.GetTxID(err); txID != "" {
		fields["txID"] = txID
	}
	entry := lg.l.WithFields(fields)

	//nolint:exhaustive //it's ok
	switch errors.Level(err) {
	case errors.SeverityWarn:
		entry.Warnf("%v", err)
	case errors.SeverityInfo:
		entry.Infof("%v", err)
	case errors.SeverityDebug:
		entry.Debugf("%v", err)
	default:
		entry.Errorf("%v", err)
	}
}
